import { NextResponse } from 'next/server';
import getSupabaseServer from '@/lib/supabase-server';

const isTokenExpired = (expiresAt: string | null | undefined) =>
  Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());

/**
 * GET /api/public/share/[token]
 *
 * Resolves a share token to user info.
 * Used by /share/[token] page to identify the owner.
 * No auth required — the token itself is the credential.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tokenRow, error: tokenError } = await (supabase as any)
      .from('share_tokens')
      .select('user_id,expires_at')
      .eq('token', token)
      .maybeSingle() as {
      data: { user_id: string; expires_at: string | null } | null;
      error: unknown;
    };

    if (tokenError || !tokenRow || isTokenExpired(tokenRow.expires_at)) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id,username,display_name,avatar_url')
      .eq('id', tokenRow.user_id)
      .maybeSingle();

    if (userError || !userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: categoryProfile } = await supabase
      .from('user_category_profiles')
      .select('profiles')
      .eq('user_id', userRow.id)
      .maybeSingle();

    return NextResponse.json({
      userId: userRow.id,
      username: userRow.username,
      displayName: userRow.display_name,
      avatarUrl: userRow.avatar_url,
      categoryProfile: categoryProfile?.profiles ?? null,
    });
  } catch (error) {
    console.error('Share token resolve error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
