import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const gameIdParam = params.id;
    const gameId = Number.parseInt(gameIdParam, 10);

    if (!gameIdParam || Number.isNaN(gameId)) {
      return NextResponse.json({ error: 'Λάθος ID παιχνιδιού' }, { status: 400 });
    }

    const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Transform trophy data to match expected format
    const trophyData = {
      platinum: data.trophy_platinum || 0,
      gold: data.trophy_gold || 0,
      silver: data.trophy_silver || 0,
      bronze: data.trophy_bronze || 0,
    };

    return NextResponse.json(trophyData);
  } catch (error) {
    console.error('❌ Σφάλμα διακομιστή:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
