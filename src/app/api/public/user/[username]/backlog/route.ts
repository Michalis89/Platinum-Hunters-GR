import { NextResponse } from 'next/server';
import getSupabaseServer from '@/lib/supabase-server';
import { MEDIA_CATEGORY_CONFIGS } from '@/lib/api/media/config';
import { mapLibraryEntry } from '@/lib/api/media/utils/entry-mapper';
import type { LibraryRow } from '@/lib/api/media/types';

function findConfigForCategory(category: string) {
  return Object.values(MEDIA_CATEGORY_CONFIGS).find(config =>
    config.subcategories.includes(category),
  );
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') ?? 'anime';
    const status = searchParams.get('status');

    const config = findConfigForCategory(category);
    if (!config) {
      return NextResponse.json({ error: 'Unsupported category' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data: user } = await supabase
      .from('users')
      .select('id,privacy_settings')
      .eq('username', username)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const privacy = user.privacy_settings as { profile_visibility?: string } | null;
    if (privacy?.profile_visibility === 'private') {
      return NextResponse.json({ error: 'Profile is private' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('user_media_entries')
      .select(config.librarySelectFields)
      .eq('user_id', user.id)
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
      userId: user.id,
      category,
      status: status ?? 'all',
      items: filteredItems,
    });
  } catch (error) {
    console.error('Public username backlog fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
