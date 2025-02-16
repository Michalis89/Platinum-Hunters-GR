import { NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function GET(req: Request, context: { params: { id: string } }) {
  try {
    const params = await context.params; //NOSONAR
    const { id } = params;

    console.log("📥 Ανάκτηση οδηγού για game_id:", id);

    // 📡 Query στη βάση για τα guides που αντιστοιχούν στο game_id
    const { data: guides, error } = await supabase.from("guides").select("*").eq("game_id", id);

    if (error) {
      console.error("❌ Σφάλμα στη λήψη δεδομένων από τη βάση:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!guides || guides.length === 0) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    return NextResponse.json(guides);
  } catch (error) {
    console.error("❌ Σφάλμα διακομιστή:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
