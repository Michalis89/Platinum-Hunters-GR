import { NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase.from("games").select("*").eq("id", params.id).single();

    if (error) {
      console.error("❌ Σφάλμα στη φόρτωση του παιχνιδιού:", error);
      return NextResponse.json({ error: "Το παιχνίδι δεν βρέθηκε" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Σφάλμα στη φόρτωση του παιχνιδιού:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
