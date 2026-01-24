import { NextResponse } from 'next/server';
import { type SupabaseClient } from '@supabase/supabase-js';
import supabase from '@/lib/db';
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
      bug_reports: {
        Row: {
          id: number;
          submission_id: number;
          bug_type: string;
          description: string;
          screenshot_url: string | null;
        };
        Insert: {
          submission_id: number;
          bug_type: string;
          description: string;
          screenshot_url?: string | null;
        };
        Update: {
          submission_id?: number;
          bug_type?: string;
          description?: string;
          screenshot_url?: string | null;
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

const typedSupabase = supabase as unknown as SupabaseClient<ExtendedDatabase>;

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

    const { data: submission, error: submissionError } = await typedSupabase
      .from('submissions')
      .insert({ type: 'bug_report', status: 'pending' })
      .select('id')
      .single();

    if (submissionError) throw submissionError;

    const submission_id = submission.id;

    const { error: dbError } = await typedSupabase.from('bug_reports').insert({
      submission_id,
      bug_type,
      description,
      screenshot_url: fileUrl,
    });

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
