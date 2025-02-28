import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function POST(req: Request) {
  try {
    const formData = await req.json();
    const { title, description, reason, example_url, priority } = formData;

    if (!title || !description || !reason) {
      return NextResponse.json(
        { error: 'Όλα τα απαιτούμενα πεδία πρέπει να συμπληρωθούν.' },
        { status: 400 },
      );
    }

    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert([{ type: 'feature_request', status: 'pending' }])
      .select('id')
      .single();

    if (submissionError) throw submissionError;

    const { error } = await supabase.from('feature_requests').insert([
      {
        submission_id: submission.id,
        title,
        description,
        why_is_it_useful: reason,
        reference_url: example_url,
        priority,
      },
    ]);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: '✅ Η υποβολή ολοκληρώθηκε επιτυχώς!' }, { status: 201 });
  } catch (error) {
    let errorMessage = 'Σφάλμα κατά την υποβολή.';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
