import { NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function GET(req: Request, context: { params: { id: string } }) {
  try {
    const { params } = await context; //NOSONAR
    const gameId = params?.id;

    if (!gameId) {
      return NextResponse.json({ error: "Λάθος ID παιχνιδιού" }, { status: 400 });
    }

    const { data, error } = await supabase.from("games").select("*").eq("id", gameId).single();

    if (error || !data) {
      console.error("❌ Σφάλμα στη φόρτωση του παιχνιδιού:", error);
      return NextResponse.json({ error: "Το παιχνίδι δεν βρέθηκε" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Σφάλμα στη φόρτωση του παιχνιδιού:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
