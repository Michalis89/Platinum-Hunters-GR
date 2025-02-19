import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const bug_type = formData.get('bug_type') as string;
    const description = formData.get('description') as string;
    const file = formData.get('screenshot') as File | null;

    if (!bug_type || !description) {
      return NextResponse.json(
        { error: 'Όλα τα απαιτούμενα πεδία πρέπει να συμπληρωθούν.' },
        { status: 400 },
      );
    }

    let fileUrl = null;

    if (file) {
      const fileBuffer = await file.arrayBuffer();
      const fileName = `bug_reports/${Date.now()}-${file.name}`;

      const { error } = await supabase.storage
        .from('bug_reports')
        .upload(fileName, fileBuffer, { contentType: file.type });

      if (error) throw error;

      fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bug_reports/${fileName}`;
    }

    // **1. Δημιουργία νέας εγγραφής στον πίνακα submissions**
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert([{ type: 'bug_report', status: 'pending' }])
      .select('id') // Παίρνουμε πίσω το ID της νέας εγγραφής
      .single(); // Επιστρέφει ένα μόνο αντικείμενο

    if (submissionError) throw submissionError;

    const submission_id = submission.id; // Παίρνουμε το ID της νέας εγγραφής

    // **2. Εισαγωγή του bug report με το σωστό submission_id**
    const { error: dbError } = await supabase
      .from('bug_reports')
      .insert([{ submission_id, bug_type, description, screenshot_url: fileUrl }]);

    if (dbError) throw dbError;

    return NextResponse.json({ message: '✅ Η αναφορά υποβλήθηκε επιτυχώς!' }, { status: 201 });
  } catch (error) {
    let errorMessage = 'Σφάλμα στην υποβολή.';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
