import { NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!params?.id) {
      return NextResponse.json({ error: "Missing game ID" }, { status: 400 });
    }

    const gameId = Number(params.id); // Μετατροπή του ID σε αριθμό
    const { steps } = await req.json();

    console.log("📤 Ενημέρωση οδηγού για game_id:", gameId);
    console.log("📥 Βήματα που λαμβάνονται:", steps);

    if (!steps || !Array.isArray(steps)) {
      return NextResponse.json({ error: "Invalid steps data" }, { status: 400 });
    }

    // 🔎 Βεβαιώσου ότι υπάρχει ο οδηγός πριν τον ενημερώσεις
    const { data: existingGuide, error: fetchError } = await supabase
      .from("guides")
      .select("*")
      .eq("game_id", gameId) // ✅ Τώρα ψάχνουμε με game_id
      .maybeSingle();

    console.log("🔎 Supabase query result:", existingGuide, "Error:", fetchError);

    if (fetchError) {
      console.error("❌ Σφάλμα εύρεσης οδηγού:", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!existingGuide) {
      return NextResponse.json({ error: "Guide not found for this game" }, { status: 404 });
    }

    // 🔄 Εκτέλεση ενημέρωσης
    const { error: updateError } = await supabase
      .from("guides")
      .update({ steps })
      .eq("game_id", gameId); // ✅ Ενημερώνουμε με βάση το game_id

    if (updateError) {
      console.error("❌ Σφάλμα ενημέρωσης οδηγού:", updateError);
      return NextResponse.json({ error: "Failed to update guide" }, { status: 500 });
    }

    return NextResponse.json({ message: "✅ Ο οδηγός ενημερώθηκε επιτυχώς!" });
  } catch (error) {
    console.error("❌ Σφάλμα διακομιστή:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
