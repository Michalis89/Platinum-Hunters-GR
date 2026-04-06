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

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') ?? 'anime';
    const status = searchParams.get('status');

    const config = findConfigForCategory(category);
    if (!config) {
      return NextResponse.json({ error: 'Unsupported category' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tokenRow } = await ((supabase as any)
      .from('share_tokens')
      .select('user_id,expires_at')
      .eq('token', token)
      .maybeSingle() as Promise<{
      data: { user_id: string; expires_at: string | null } | null;
    }>);

    if (!tokenRow || isTokenExpired(tokenRow.expires_at)) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('user_media_entries')
      .select(config.librarySelectFields)
      .eq('user_id', tokenRow.user_id)
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

    const filteredItems = status ? items.filter(item => item.status === status) : items;

    return NextResponse.json({
      userId: tokenRow.user_id,
      category,
      status: status ?? 'all',
      items: filteredItems,
    });
  } catch (error) {
    console.error('Public share backlog fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
