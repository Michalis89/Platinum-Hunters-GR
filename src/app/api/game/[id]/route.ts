import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const gameId = params.id;

    if (!gameId) {
      return NextResponse.json({ error: 'Λάθος ID παιχνιδιού' }, { status: 400 });
    }

    const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Σφάλμα διακομιστή:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
