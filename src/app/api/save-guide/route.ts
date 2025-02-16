import { NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function POST(req: Request) {
  try {
    // Ανάγνωση δεδομένων από το request
    const { title, platform, gameImage, trophies } = await req.json();

    // Εισαγωγή δεδομένων στον πίνακα "games"
    const { data, error } = await supabase
      .from("games") // Πίνακας "games"
      .insert([
        {
          title,
          platform,
          game_image: gameImage,
          platinum: parseInt(trophies?.Platinum) || 0,
          gold: parseInt(trophies?.Gold) || 0,
          silver: parseInt(trophies?.Silver) || 0,
          bronze: parseInt(trophies?.Bronze) || 0,
        },
      ])
      .select("*") // Επιστροφή των εισαγόμενων δεδομένων
      .single(); // Μία μόνο εγγραφή

    // Αν υπάρχει σφάλμα στην αποθήκευση
    if (error) {
      console.error("❌ Σφάλμα αποθήκευσης:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ message: "✅ Ο οδηγός αποθηκεύτηκε!", game: data });
  } catch (error) {
    console.error("❌ Σφάλμα αποθήκευσης:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
