import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClient>>;

type InsertActivityOptions = {
  logContext?: string;
};

export async function insertActivity(
  supabase: SupabaseClient,
  userId: string,
  type: string,
  payload: Record<string, unknown>,
  options: InsertActivityOptions = {},
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('activity_log') as any).insert({
      user_id: userId,
      type,
      payload,
    });
  } catch (err) {
    const label = options.logContext ?? `Activity insert (${type})`;
    console.warn(`${label} failed:`, err);
  }
}
