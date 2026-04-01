import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import getSupabaseServer from '@/lib/supabase-server';

type ShareTokenRow = {
  token: string;
  created_at: string;
  expires_at: string | null;
};

type ShareTokenCreatePayload = {
  expiresInDays?: 7 | 30 | null;
};

/**
 * GET /api/me/share-token
 * Returns the authenticated user's current share token (or null if not generated yet).
 */
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);

    const db = getSupabaseServer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (db as any)
      .from('share_tokens')
      .select('token,created_at,expires_at')
      .eq('user_id', session.user.id)
      .maybeSingle() as { data: ShareTokenRow | null };

    return NextResponse.json({
      token: data?.token ?? null,
      createdAt: data?.created_at ?? null,
      expiresAt: data?.expires_at ?? null,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Share token GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/me/share-token
 * Generates (or regenerates) a share token for the authenticated user.
 * Every call produces a new random token, invalidating the previous one.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);

    const payload = (await request.json().catch(() => null)) as ShareTokenCreatePayload | null;
    const expiresInDays = payload?.expiresInDays ?? null;
    if (expiresInDays !== null && expiresInDays !== 7 && expiresInDays !== 30) {
      return NextResponse.json({ error: 'Invalid expiresInDays value' }, { status: 400 });
    }
    const expiresAt =
      expiresInDays === null
        ? null
        : new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    // Generate a cryptographically random 32-char hex token
    const newToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const db = getSupabaseServer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (db as any)
      .from('share_tokens')
      .upsert(
        { user_id: session.user.id, token: newToken, expires_at: expiresAt },
        { onConflict: 'user_id' },
      )
      .select('token,created_at,expires_at')
      .single() as { data: ShareTokenRow | null; error: unknown };

    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error('Failed to generate share token');
    }

    return NextResponse.json({
      token: data.token,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Share token POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/me/share-token
 * Revokes the authenticated user's share token (existing share URLs stop working).
 */
export async function DELETE() {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);

    const db = getSupabaseServer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).from('share_tokens').delete().eq('user_id', session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Share token DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
