import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function PUT(
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any,
) {
  try {
    if (!(await context.params)?.id) {
      return NextResponse.json({ error: 'Missing game ID' }, { status: 400 });
    }

    const gameId = Number((await context.params).id);
    const { steps } = await req.json();

    if (!steps || !Array.isArray(steps)) {
      return NextResponse.json({ error: 'Invalid steps data' }, { status: 400 });
    }

    const { data: existingGuide, error: fetchError } = await supabase
      .from('guides')
      .select('*')
      .eq('game_id', gameId)
      .maybeSingle();

    console.log('🔎 Supabase query result:', existingGuide, 'Error:', fetchError);

    if (fetchError) {
      console.error('❌ Σφάλμα εύρεσης οδηγού:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!existingGuide) {
      return NextResponse.json({ error: 'Guide not found for this game' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('guides')
      .update({ steps })
      .eq('game_id', gameId);

    if (updateError) {
      console.error('❌ Σφάλμα ενημέρωσης οδηγού:', updateError);
      return NextResponse.json({ error: 'Failed to update guide' }, { status: 500 });
    }

    return NextResponse.json({ message: '✅ Ο οδηγός ενημερώθηκε επιτυχώς!' });
  } catch (error) {
    console.error('❌ Σφάλμα διακομιστή:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
