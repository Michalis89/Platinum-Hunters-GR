import { NextResponse } from 'next/server';
import supabase from '@/lib/db';
import { GeneralQuestionDBEntry, GeneralQuestionRequest } from '@/types/forms';

const validateRequest = ({
  category,
  question,
  email,
  serviceDescription,
  infoType,
  infoDetails,
  feedbackRating,
}: GeneralQuestionRequest) => {
  if (!email) return 'Το email είναι υποχρεωτικό.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Το email δεν είναι έγκυρο.';

  const validations = {
    Support: () =>
      !serviceDescription?.trim() ? 'Η περιγραφή της υπηρεσίας είναι υποχρεωτική.' : null,
    Info: () =>
      !infoType?.trim() || !infoDetails?.trim()
        ? 'Το θέμα και η περιγραφή πληροφοριών είναι υποχρεωτικά.'
        : null,
    Feedback: () => (!feedbackRating ? 'Η βαθμολογία Feedback είναι υποχρεωτική.' : null),
    Other: () => (!question?.trim() ? 'Η ερώτηση είναι υποχρεωτική.' : null),
  };

  return validations[category]?.() ?? null;
};

const createSubmission = async () => {
  const { data, error } = await supabase
    .from('submissions')
    .insert([{ type: 'general_question', status: 'pending' }])
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
};

const insertGeneralQuestion = async (submission_id: number, payload: GeneralQuestionDBEntry) => {
  const { error } = await supabase
    .from('general_questions')
    .insert([{ submission_id, ...payload }]);
  if (error) throw error;
};

export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    const {
      category,
      question,
      email,
      serviceName,
      serviceDescription,
      infoType,
      infoDetails,
      feedbackRating,
    } = requestData;

    // ✅ Validation πριν γίνει οποιαδήποτε κλήση στη βάση
    const validationError = validateRequest(requestData);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // ✅ Δημιουργία submission
    const submission_id = await createSubmission();

    // ✅ Προετοιμασία δεδομένων προς εισαγωγή
    const payload = {
      category,
      question: category === 'Other' ? question : null,
      email,
      service_name: category === 'Support' ? serviceName : null,
      service_description: category === 'Support' ? serviceDescription : null,
      info_type: category === 'Info' ? infoType : null,
      info_details: category === 'Info' ? infoDetails : null,
      feedback_rating: category === 'Feedback' ? feedbackRating : null,
    };

    // ✅ Εισαγωγή στη βάση
    await insertGeneralQuestion(submission_id, payload);

    return NextResponse.json(
      { message: '✅ Η ερώτησή σας καταχωρήθηκε επιτυχώς!', submission_id },
      { status: 201 },
    );
  } catch (error) {
    console.error('❌ API Error:', error);

    let errorMessage = 'Σφάλμα κατά την υποβολή.';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
