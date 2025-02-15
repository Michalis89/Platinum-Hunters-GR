import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM games ORDER BY title ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('❌ Σφάλμα στη φόρτωση των παιχνιδιών:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
