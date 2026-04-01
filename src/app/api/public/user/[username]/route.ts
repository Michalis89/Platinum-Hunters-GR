import { NextResponse } from 'next/server';
import getSupabaseServer from '@/lib/supabase-server';

/**
 * GET /api/public/user/[username]
 *
 * Resolves a username to user info, checking privacy settings.
 * Returns 403 if the profile is private.
 * Used by /u/[username]/backlog to identify the owner.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;

    const supabase = getSupabaseServer();

    const { data: userRow, error } = await supabase
      .from('users')
      .select('id,username,display_name,avatar_url,privacy_settings')
      .eq('username', username)
      .maybeSingle();

    if (error || !userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const privacy = userRow.privacy_settings as { profile_visibility?: string } | null;
    const visibility = privacy?.profile_visibility ?? 'public';

    if (visibility === 'private') {
      return NextResponse.json({ error: 'Profile is private' }, { status: 403 });
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
    console.error('Public user resolve error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
