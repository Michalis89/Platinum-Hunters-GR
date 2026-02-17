import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

const TOP_FIVE_LIMIT = 5;

export async function POST(request: NextRequest) {
  let body: { category?: string; order?: unknown } | undefined;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const category = typeof body?.category === 'string' ? body.category.trim() : '';
  const order = Array.isArray(body?.order) ? body.order : [];

  if (!category) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400 });
  }

  if (!order.length) {
    return NextResponse.json({ error: 'Order is required' }, { status: 400 });
  }

  const normalizedOrder = order.map(id => Number(id));
  if (normalizedOrder.some(id => Number.isNaN(id))) {
    return NextResponse.json({ error: 'Invalid entry identifiers' }, { status: 400 });
  }

  if (new Set(normalizedOrder).size !== normalizedOrder.length) {
    return NextResponse.json(
      { error: 'Duplicate entry identifiers are not allowed' },
      { status: 400 },
    );
  }

  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: allowedEntries, error: allowedEntriesError } = await supabase
    .from('user_media_entries')
    .select('id, media_items!inner(category)')
    .eq('user_id', session.user.id)
    .eq('is_favorite', true)
    .in('id', normalizedOrder)
    .eq('media_items.category', category);

  if (allowedEntriesError) {
    return NextResponse.json({ error: allowedEntriesError.message }, { status: 500 });
  }

  const validIds = new Set(
    (allowedEntries ?? [])
      .map(row => row.id)
      .filter((id): id is number => typeof id === 'number' && Number.isFinite(id)),
  );

  if (validIds.size !== normalizedOrder.length) {
    return NextResponse.json(
      { error: 'Some entries are invalid for this category' },
      { status: 400 },
    );
  }

  const updates = normalizedOrder.map((entryId, index) =>
    supabase
      .from('user_media_entries')
      .update({
        priority: (normalizedOrder.length - index) * 10,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id)
      .eq('id', entryId),
  );

  const updateResults = await Promise.all(updates);
  const updateError = updateResults.find(result => result.error)?.error;
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const topFiveOrder = normalizedOrder.slice(0, TOP_FIVE_LIMIT);
  const { error: pinError } = await supabase.rpc('reorder_pins', {
    p_user_id: session.user.id,
    p_category: category,
    p_order: topFiveOrder,
  });

  if (pinError) {
    return NextResponse.json({ error: pinError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
