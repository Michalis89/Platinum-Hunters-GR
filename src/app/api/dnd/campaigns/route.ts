import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createCampaign, listCampaignsForUser } from '@/lib/dnd/queries/campaigns';

const createCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  system: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
});

export async function GET() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const campaigns = await listCampaignsForUser(supabase, session.user.id);
    return NextResponse.json({ data: campaigns });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list campaigns';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid campaign payload' }, { status: 400 });
  }

  try {
    const campaign = await createCampaign(
      supabase,
      {
        name: parsed.data.name,
        system: parsed.data.system ?? null,
        description: parsed.data.description ?? null,
      },
      session.user.id,
    );

    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create campaign';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
