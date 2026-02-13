import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { USER_SETTINGS_DEFAULTS, UserSettingsData } from './types';

interface SettingsOptions {
  supabase?: SupabaseClient<Database>;
}

const buildDefaultRow = (userId: string): UserSettingsData => ({
  user_id: userId,
  created_at: null,
  updated_at: null,
  ...USER_SETTINGS_DEFAULTS,
});

export async function getUserSettings(userId: string, options?: SettingsOptions) {
  const supabase = options?.supabase ?? (await createRouteHandlerClient());

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return buildDefaultRow(userId);
  }

  return {
    ...buildDefaultRow(userId),
    ...data,
  } as UserSettingsData;
}
