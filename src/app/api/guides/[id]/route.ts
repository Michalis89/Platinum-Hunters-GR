import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: 'Λάθος ID οδηγού' }, { status: 400 });
    }

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
