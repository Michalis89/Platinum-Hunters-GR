import supabase from '@/lib/db';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return fail({ error: 'Το slug είναι υποχρεωτικό' }, 400);
    }

    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('❌ Σφάλμα στη φόρτωση του παιχνιδιού:', error);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    if (!game) {
      return fail({ error: 'Το παιχνίδι δεν βρέθηκε' }, 404);
    }

    return ok(game);
  } catch (error) {
    console.error('❌ Σφάλμα στη φόρτωση του παιχνιδιού:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}
