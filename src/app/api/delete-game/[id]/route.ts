import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

type Params = Promise<{ id: string }>;

export async function DELETE(req: Request, context: { params: Params }) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Missing game ID' }, { status: 400 });
    }

    const gameId = Number(id);

    const { error: deleteGameError } = await supabase.from('games').delete().eq('id', gameId);

    if (deleteGameError) {
      console.error('❌ Σφάλμα διαγραφής game:', deleteGameError);
      return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
    }

    return NextResponse.json({ message: '✅ Το παιχνίδι διαγράφηκε επιτυχώς!' });
  } catch (error) {
    console.error('❌ Σφάλμα διακομιστή:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
