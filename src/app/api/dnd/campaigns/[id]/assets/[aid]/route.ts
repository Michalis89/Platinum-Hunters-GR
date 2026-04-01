import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getCampaignRole, requireCampaignDm, requireCampaignMember } from '@/lib/dnd/access';
import { deleteAsset, getAsset, updateAsset } from '@/lib/dnd/queries/assets';

const paramsSchema = z.object({
  id: z.string().uuid(),
  aid: z.string().uuid(),
});

const assetMetaSchema = z.object({
  path: z.string(),
  type: z.enum(['image', 'pdf', 'other']).optional(),
  title: z.string().max(200).optional().nullable(),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
});

const updateAssetSchema = assetMetaSchema
  .pick({ title: true, tags: true, published: true })
  .partial()
  .refine(
    data => data.title !== undefined || data.tags !== undefined || data.published !== undefined,
    { message: 'At least one field must be provided' },
  );

async function withSignedUrl<T extends { path: string }>(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  asset: T,
): Promise<T & { signed_url: string | null }> {
  const { data, error } = await supabase.storage.from('campaign-assets').createSignedUrl(asset.path, 3600);

  if (error) {
    return {
      ...asset,
      signed_url: null,
    };
  }

  return {
    ...asset,
    signed_url: data.signedUrl,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; aid: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign or asset id' }, { status: 400 });
  }

  const { id: campaignId, aid: assetId } = parsedParams.data;
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await requireCampaignMember(supabase, campaignId, session.user.id);
    const role = await getCampaignRole(supabase, campaignId, session.user.id);
    const item = await getAsset(supabase, campaignId, assetId, role === 'dm' || role === 'co_dm');

    if (!item) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const withUrl = await withSignedUrl(supabase, item);
    return NextResponse.json({ data: withUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch asset';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; aid: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign or asset id' }, { status: 400 });
  }

  const { id: campaignId, aid: assetId } = parsedParams.data;
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsedBody = updateAssetSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid asset payload' }, { status: 400 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    const updated = await updateAsset(supabase, campaignId, assetId, {
      ...(parsedBody.data.title !== undefined ? { title: parsedBody.data.title ?? null } : {}),
      ...(parsedBody.data.tags !== undefined ? { tags: parsedBody.data.tags } : {}),
      ...(parsedBody.data.published !== undefined ? { published: parsedBody.data.published } : {}),
    });

    const withUrl = await withSignedUrl(supabase, updated);
    return NextResponse.json({ data: withUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update asset';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes('no rows') || message.includes('0 rows')) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; aid: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign or asset id' }, { status: 400 });
  }

  const { id: campaignId, aid: assetId } = parsedParams.data;
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    const deleted = await deleteAsset(supabase, campaignId, assetId);

    if (!deleted) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete asset';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
