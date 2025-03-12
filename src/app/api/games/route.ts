import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('title', { ascending: true });

    if (error) {
      console.error('❌ Σφάλμα στη φόρτωση των παιχνιδιών:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Σφάλμα στη φόρτωση των παιχνιδιών:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
