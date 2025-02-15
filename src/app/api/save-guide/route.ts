import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { title, platform, gameImage, trophies } = await req.json();

    const gameInsertQuery = `
      INSERT INTO games (title, platform, game_image, platinum, gold, silver, bronze)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const gameValues = [
      title,
      platform,
      gameImage,
      parseInt(trophies?.Platinum) || 0,
      parseInt(trophies?.Gold) || 0,
      parseInt(trophies?.Silver) || 0,
      parseInt(trophies?.Bronze) || 0,
    ];

    const result = await pool.query(gameInsertQuery, gameValues);
    return NextResponse.json({ message: '✅ Ο οδηγός αποθηκεύτηκε!', game: result.rows[0] });
  } catch (error) {
    console.error('❌ Σφάλμα αποθήκευσης:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
