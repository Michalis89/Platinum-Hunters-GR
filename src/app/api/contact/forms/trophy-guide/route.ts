import { NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.game_name || body.game_name.trim() === "") {
      return NextResponse.json(
        { error: "Το όνομα του παιχνιδιού είναι υποχρεωτικό." },
        { status: 400 }
      );
    }

    // Βήμα 1: Εισαγωγή στο submissions table
    const { data: submissionData, error: submissionError } = await supabase
      .from("submissions")
      .insert([{ type: "trophy_guide" }])
      .select();

    if (submissionError) throw submissionError;

    const submissionId = submissionData[0].id;

    // Βήμα 2: Εισαγωγή στο trophy_guides table
    const { error: guideError } = await supabase.from("trophy_guides").insert([
      {
        submission_id: submissionId,
        game_name: body.game_name,
        additional_comments: body.additional_comments || "",
      },
    ]);

    if (guideError) throw guideError;

    return NextResponse.json({ message: "Το αίτημα καταχωρήθηκε επιτυχώς!" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
