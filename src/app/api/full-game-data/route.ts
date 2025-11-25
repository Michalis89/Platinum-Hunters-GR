import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET() {
  try {
    const { data, error } = await supabase.from('full_game_data').select('*');

    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (err) {
    console.error('❌ Σφάλμα κατά τη φόρτωση των παιχνιδιών:', err);
    return NextResponse.json({ error: 'Αποτυχία φόρτωσης των παιχνιδιών' }, { status: 500 });
  }
}
