import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getUserSettings } from './getUserSettings';
import type { UserSettingsData, UserSettingsUpdate, UserSettingsValue } from './types';

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

  const normalized: Partial<UserSettingsValue> = { ...updates };

  // Auto-enable parent features when child features are enabled
  const isSocialFeatureEnabled =
    updates.community_activity_enabled === true ||
    updates.community_suggestions_enabled === true ||
    updates.social_profile_enabled === true;

  if (isSocialFeatureEnabled && updates.social_enabled === undefined) {
    normalized.social_enabled = true;
  }

  if (updates.dnd_role !== undefined && updates.dnd_role !== null && updates.dnd_enabled === undefined) {
    normalized.dnd_enabled = true;
  }

  const finalSocialEnabled = normalized.social_enabled ?? current.social_enabled;
  const finalDndEnabled = normalized.dnd_enabled ?? current.dnd_enabled;

  // Disable child features when parent features are disabled
  if (finalSocialEnabled === false) {
    normalized.community_activity_enabled = false;
    normalized.community_suggestions_enabled = false;
    normalized.social_profile_enabled = false;
  }

  if (finalDndEnabled === false) {
    normalized.dnd_role = null;
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
