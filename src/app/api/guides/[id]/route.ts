import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, context: any) {
  try {
    const { params } = await context; // ✅ Σωστό await
    const id = params.id as string;

    if (!id) {
      return NextResponse.json({ error: 'Λάθος ID οδηγού' }, { status: 400 });
    }

    console.log('📥 Ανάκτηση οδηγού για game_id:', id);

    const { data: guides, error } = await supabase.from('guides').select('*').eq('game_id', id);

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!guides || guides.length === 0) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    return NextResponse.json(guides);
  } catch (error) {
    console.error('❌ Σφάλμα διακομιστή:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
