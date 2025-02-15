import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const result = await pool.query('SELECT * FROM games WHERE id = $1', [params.id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Το παιχνίδι δεν βρέθηκε' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Σφάλμα στη φόρτωση του παιχνιδιού:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
