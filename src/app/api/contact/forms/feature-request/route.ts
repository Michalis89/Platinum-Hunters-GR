import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

type ExtendedDatabase = Database & {
  __InternalSupabase: Database['__InternalSupabase'];
  public: {
    Tables: Database['public']['Tables'] & {
      submissions: {
        Row: { id: number };
        Insert: { type: string; status: string };
        Update: { type?: string; status?: string };
        Relationships: [];
      };
      feature_requests: {
        Row: { id: number; submission_id: number };
        Insert: {
          submission_id: number;
          title: string;
          description: string;
          why_is_it_useful: string;
          reference_url?: string | null;
          priority?: string | null;
        };
        Update: {
          submission_id?: number;
          title?: string;
          description?: string;
          why_is_it_useful?: string;
          reference_url?: string | null;
          priority?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Database['public']['Views'];
    Functions: Database['public']['Functions'];
    Enums: Database['public']['Enums'];
    CompositeTypes: Database['public']['CompositeTypes'];
  };
};

const typedSupabase = createClient<ExtendedDatabase>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

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

    const { data: submission, error: submissionError } = await typedSupabase
      .from('submissions')
      .insert({ type: 'feature_request', status: 'pending' })
      .select('id')
      .single();

    if (submissionError) throw submissionError;

    const { error } = await typedSupabase.from('feature_requests').insert({
      submission_id: submission.id,
      title,
      description,
      why_is_it_useful: reason,
      reference_url: example_url,
      priority,
    });

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
