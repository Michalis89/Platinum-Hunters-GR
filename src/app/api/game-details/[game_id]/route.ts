import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, context: any) {
  try {
    const { params } = await context;
    const gameId = params.game_id as string;

    if (!gameId) {
      return NextResponse.json({ error: 'Λάθος ID παιχνιδιού' }, { status: 400 });
    }

    console.log('📥 Ανάκτηση λεπτομερειών για game_id:', gameId);

    const { data, error } = await supabase
      .from('game_details')
      .select('*')
      .eq('game_id', gameId)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Game details not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Σφάλμα διακομιστή:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
