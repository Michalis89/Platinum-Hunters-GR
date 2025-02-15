import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const result = await pool.query("SELECT * FROM guides WHERE game_id = $1", [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Δεν υπάρχουν guides για αυτό το παιχνίδι" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("❌ Σφάλμα στη φόρτωση των guides:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
