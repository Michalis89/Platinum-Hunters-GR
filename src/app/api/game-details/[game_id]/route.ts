import { NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function GET(req: Request, context: { params: { game_id: string } }) {
  try {
    const { game_id } = context.params;

    console.log("📥 Ανάκτηση λεπτομερειών για game_id:", game_id);

    // 📡 Query στη βάση για το game_details με βάση το game_id
    const { data, error } = await supabase
      .from("game_details")
      .select("*")
      .eq("game_id", game_id)
      .single();

    if (error) {
      console.error("❌ Σφάλμα στη λήψη δεδομένων από τη βάση:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Game details not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Σφάλμα διακομιστή:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
