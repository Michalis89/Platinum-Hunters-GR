import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import supabase from '@/lib/db';
import { GeneralQuestionDBEntry } from '@/types/forms';
import { generalQuestionSchema } from '@/lib/validation/forms';

const createSubmission = async () => {
  const { data, error } = await supabase
    .from('submissions')
    .insert({ type: 'general_question', status: 'pending' })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
};

const insertGeneralQuestion = async (submission_id: number, payload: GeneralQuestionDBEntry) => {
  const { error } = await supabase
    .from('general_questions')
    .insert({ submission_id, ...payload });
  if (error) throw error;
};

export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    const parsedData = generalQuestionSchema.parse(requestData);

    const submission_id = await createSubmission();

    const normalizeText = (value?: string | null) => {
      if (!value) return undefined;
      const trimmed = value.trim();
      return trimmed ? trimmed : undefined;
    };

    const payload: GeneralQuestionDBEntry = {
      category: parsedData.category,
      question: parsedData.category === 'Other' ? normalizeText(parsedData.question) : undefined,
      email: parsedData.email.trim(),
      service_name:
        parsedData.category === 'Support' ? normalizeText(parsedData.serviceName) : undefined,
      service_description:
        parsedData.category === 'Support' ? normalizeText(parsedData.serviceDescription) : undefined,
      info_type: parsedData.category === 'Info' ? normalizeText(parsedData.infoType) : undefined,
      info_details: parsedData.category === 'Info' ? normalizeText(parsedData.infoDetails) : undefined,
      feedback_rating: parsedData.category === 'Feedback' ? parsedData.feedbackRating ?? null : null,
    };

    await insertGeneralQuestion(submission_id, payload);

    return NextResponse.json(
      { message: 'Η ερώτησή σας καταχωρήθηκε επιτυχώς!', submission_id },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const errorMessage =
        error.issues.map(issue => issue.message).join(' ') || 'Μη έγκυρο αίτημα';
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    console.error('API Error:', error);

    let errorMessage = 'Σφάλμα κατά την υποβολή.';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
