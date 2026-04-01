import { NextResponse } from 'next/server';
import getSupabaseServer from '@/lib/supabase-server';
import { MEDIA_CATEGORY_CONFIGS } from '@/lib/api/media/config';
import { mapLibraryEntry } from '@/lib/api/media/utils/entry-mapper';
import type { LibraryRow } from '@/lib/api/media/types';

const isTokenExpired = (expiresAt: string | null | undefined) =>
  Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());

function findConfigForCategory(category: string) {
  return Object.values(MEDIA_CATEGORY_CONFIGS).find(config =>
    config.subcategories.includes(category),
  );
}

/**
 * GET /api/public/library?userId={uuid}&category={category}
 *
 * Returns the library entries for any user without requiring auth.
 * Used by read-only share pages (/u/[username]/backlog, /share/[token]).
 * Uses the service-role client which bypasses RLS.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category') ?? 'anime';
    const shareToken = searchParams.get('token');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const config = findConfigForCategory(category);
    if (!config) {
      return NextResponse.json({ error: 'Unsupported category' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data: userRow } = await supabase
      .from('users')
      .select('privacy_settings')
      .eq('id', userId)
      .maybeSingle();

    if (!userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const privacy = userRow.privacy_settings as { profile_visibility?: string } | null;
    if (privacy?.profile_visibility === 'private') {
      if (!shareToken) {
        return NextResponse.json({ error: 'Profile is private' }, { status: 403 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: tokenRow } = await ((supabase as any)
        .from('share_tokens')
        .select('user_id,expires_at')
        .eq('token', shareToken)
        .maybeSingle() as Promise<{
        data: { user_id: string; expires_at: string | null } | null;
      }>);

      if (!tokenRow || tokenRow.user_id !== userId || isTokenExpired(tokenRow.expires_at)) {
        return NextResponse.json({ error: 'Invalid share token' }, { status: 403 });
      }
    }

    const { data, error } = await supabase
      .from('user_media_entries')
      .select(config.librarySelectFields)
      .eq('user_id', userId)
      .eq('media_items.category', category)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const items = Array.isArray(data)
      ? data
          .map(row => mapLibraryEntry(row as unknown as LibraryRow, config))
          .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      : [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Public library fetch error:', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
