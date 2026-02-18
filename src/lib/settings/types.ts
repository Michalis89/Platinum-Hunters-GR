export type ThemeSetting = 'system' | 'dark' | 'light';
export type DndRole = 'dm' | 'player';

export type UserSettingsValue = {
  theme: ThemeSetting;
  social_enabled: boolean;
  community_activity_enabled: boolean;
  community_suggestions_enabled: boolean;
  social_profile_enabled: boolean;
  articles_enabled: boolean;
  reviews_enabled: boolean;
  diary_enabled: boolean;
  dnd_enabled: boolean;
  dnd_role: DndRole | null;
};

export type UserSettingsData = UserSettingsValue & {
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
};

export type UserSettingsUpdate = Partial<UserSettingsValue>;

export const USER_SETTINGS_DEFAULTS: UserSettingsValue = {
  theme: 'system',
  social_enabled: false,
  community_activity_enabled: false,
  community_suggestions_enabled: false,
  social_profile_enabled: false,
  articles_enabled: true,
  reviews_enabled: true,
  diary_enabled: false,
  dnd_enabled: false,
  dnd_role: null,
};
