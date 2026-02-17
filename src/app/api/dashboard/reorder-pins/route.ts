import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

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

  if (order.length > 5) {
    return NextResponse.json({ error: 'Pinned order cannot exceed five items' }, { status: 400 });
  }

  const normalizedOrder = order.map(id => Number(id));
  if (normalizedOrder.some(id => Number.isNaN(id))) {
    return NextResponse.json({ error: 'Invalid entry identifiers' }, { status: 400 });
  }

  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase.rpc('reorder_pins', {
    p_user_id: session.user.id,
    p_category: category,
    p_order: normalizedOrder,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
