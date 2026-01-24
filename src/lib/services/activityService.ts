import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import type { Database } from '@/lib/supabase/database.types';

type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClient>>;

type InsertActivityOptions = {
  logContext?: string;
};

type ActivityPayload = Database['public']['Tables']['activity_log']['Insert']['payload'];

export async function insertActivity(
  supabase: SupabaseClient,
  userId: string,
  type: string,
  payload: ActivityPayload,
  options: InsertActivityOptions = {},
) {
  try {
    const payloadData: Database['public']['Tables']['activity_log']['Insert'] = {
      user_id: userId,
      type,
      payload,
    };
    await supabase.from('activity_log').insert(payloadData);
  } catch (err) {
    const label = options.logContext ?? `Activity insert (${type})`;
    console.warn(`${label} failed:`, err);
  }
}
