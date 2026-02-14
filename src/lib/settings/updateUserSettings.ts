import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getUserSettings } from './getUserSettings';
import { UserSettingsData, UserSettingsUpdate, UserSettingsValue } from './types';

interface SettingsOptions {
  supabase?: SupabaseClient<Database>;
}

export async function updateUserSettings(
  userId: string,
  updates: UserSettingsUpdate,
  options?: SettingsOptions,
) {
  const supabase = options?.supabase ?? (await createRouteHandlerClient());
  const current = await getUserSettings(userId, { supabase });

  const finalSocialEnabled = updates.social_enabled ?? current.social_enabled;
  const normalized: Partial<UserSettingsValue> = { ...updates };

  if (finalSocialEnabled === false) {
    normalized.community_activity_enabled = false;
    normalized.community_suggestions_enabled = false;
  }

  const assignSanitized = <K extends keyof UserSettingsValue>(
    target: Partial<UserSettingsValue>,
    key: K,
    value: UserSettingsValue[K],
  ) => {
    target[key] = value;
  };

  const sanitized: Partial<UserSettingsValue> = {};
  (Object.keys(normalized) as (keyof UserSettingsValue)[]).forEach(key => {
    const value = normalized[key];
    if (value !== undefined) {
      assignSanitized(sanitized, key, value);
    }
  });

  if (Object.keys(sanitized).length === 0) {
    return current;
  }

  const payload = {
    user_id: userId,
    ...sanitized,
  };

  const { data, error } = await supabase
    .from('user_settings')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? current) as UserSettingsData;
}
