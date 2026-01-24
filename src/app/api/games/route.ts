import supabase from '@/lib/db';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('title', { ascending: true });

    if (error) {
      console.error('❌ Σφάλμα στη φόρτωση των παιχνιδιών:', error);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    return ok(data || []);
  } catch (error) {
    console.error('❌ Σφάλμα στη φόρτωση των παιχνιδιών:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}
