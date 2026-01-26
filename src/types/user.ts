import type { Database } from '@/lib/supabase/database.types';

export type UserRole = 'user' | 'author' | 'moderator' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'banned' | 'deleted';
export type ProfileVisibility = 'public' | 'friends' | 'private';

export interface PrivacySettings {
  profile_visibility: ProfileVisibility;
  show_email: boolean;
  show_stats: boolean;
  show_psn_id: boolean;
  show_age?: boolean;
  show_social_links?: boolean;
  show_location?: boolean;
}

export interface NotificationSettings {
  newsletter: boolean;
  guide_updates: boolean;
  comments: boolean;
  replies: boolean;
  weekly_digest: boolean;
}

export interface SocialLinks {
  twitter?: string;
  twitch?: string;
  youtube?: string;
  discord?: string;
  instagram?: string;
  reddit?: string;
  website?: string;
  portfolio?: string;
  location_city?: string;
}

type UserRow = Database['public']['Tables']['users']['Row'];

export type User = Omit<
  UserRow,
  'privacy_settings' | 'notification_settings' | 'social_links' | 'favorite_genres' | 'categories'
> & {
  privacy_settings: PrivacySettings | null;
  notification_settings: NotificationSettings | null;
  social_links: SocialLinks | null;
  favorite_genres: string[] | null;
  categories: string[] | null;
};

export interface PublicUserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  country: string | null;
  favorite_platform: string | null;
  favorite_genres: string[] | null;
  gaming_since: number | null;
  social_links: SocialLinks;
  total_games_completed: number;
  total_hours_played: number;
  total_platinums: number;
  created_at: string;
}

export interface UserProfileUpdate {
  full_name?: string | null;
  display_name?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  country?: string | null;
  timezone?: string | null;
  language_preference?: string;
  psn_id?: string | null;
  xbox_gamertag?: string | null;
  steam_id?: string | null;
  nintendo_id?: string | null;
  favorite_platform?: string | null;
  favorite_genres?: string[] | null;
  gaming_since?: number | null;
  categories?: string[] | null;
  privacy_settings?: Partial<PrivacySettings>;
  notification_settings?: Partial<NotificationSettings>;
  social_links?: Partial<SocialLinks>;
}

export interface UserWithStats extends User {
  guides_count?: number;
  comments_count?: number;
  likes_received?: number;
}
