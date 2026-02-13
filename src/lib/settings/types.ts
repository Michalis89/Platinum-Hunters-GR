export type ThemeSetting = 'system' | 'dark' | 'light';

export type UserSettingsValue = {
  theme: ThemeSetting;
  social_enabled: boolean;
  community_activity_enabled: boolean;
  community_suggestions_enabled: boolean;
  articles_enabled: boolean;
  reviews_enabled: boolean;
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
  articles_enabled: true,
  reviews_enabled: true,
};
