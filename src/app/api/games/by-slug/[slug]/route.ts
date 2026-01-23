import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('❌ Σφάλμα στη φόρτωση του παιχνιδιού:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error('❌ Σφάλμα στη φόρτωση του παιχνιδιού:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
