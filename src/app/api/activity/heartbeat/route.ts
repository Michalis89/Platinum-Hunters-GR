import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const bearerMatch = authHeader?.match(/^Bearer (.+)$/i);
    const accessToken = bearerMatch?.[1];

    const supabase = await createRouteHandlerClient(accessToken);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Μη εξουσιοδοτημένη πρόσβαση' }, { status: 401 });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() } as never) // Cast to satisfy Supabase's generated types
      .eq('id', session.user.id);

    if (updateError) {
      console.error('❌ Heartbeat update error:', updateError);
      return NextResponse.json({ error: 'Σφάλμα ενημέρωσης' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('❌ Heartbeat server error:', err);
    return NextResponse.json({ error: 'Σφάλμα server' }, { status: 500 });
  }
}
