import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getCampaignRole, requireCampaignDm, requireCampaignMember } from '@/lib/dnd/access';
import { createAsset, listAssets } from '@/lib/dnd/queries/assets';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const assetMetaSchema = z.object({
  path: z.string(),
  type: z.enum(['image', 'pdf', 'other']).optional(),
  title: z.string().max(200).optional().nullable(),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
});

async function withSignedUrl<T extends { path: string }>(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  assets: T[],
): Promise<Array<T & { signed_url: string | null }>> {
  return Promise.all(
    assets.map(async asset => {
      const { data, error } = await supabase.storage
        .from('campaign-assets')
        .createSignedUrl(asset.path, 3600);

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
    }),
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign id' }, { status: 400 });
  }

  const campaignId = parsedParams.data.id;
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
    const items = await listAssets(supabase, campaignId, role === 'dm' || role === 'co_dm');
    const withUrls = await withSignedUrl(supabase, items);
    return NextResponse.json({ data: withUrls });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list assets';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid campaign id' }, { status: 400 });
  }

  const campaignId = parsedParams.data.id;
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

  const parsedBody = assetMetaSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid asset metadata payload' }, { status: 400 });
  }

  try {
    await requireCampaignDm(supabase, campaignId, session.user.id);
    const created = await createAsset(
      supabase,
      campaignId,
      {
        path: parsedBody.data.path,
        type: parsedBody.data.type,
        title: parsedBody.data.title ?? null,
        tags: parsedBody.data.tags,
        published: parsedBody.data.published,
      },
      session.user.id,
    );

    const withUrls = await withSignedUrl(supabase, [created]);
    return NextResponse.json({ data: withUrls[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create asset metadata';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
