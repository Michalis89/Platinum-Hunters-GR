/**
 * User Types
 * PH-30: User Authentication System
 */

export type UserRole = 'user' | 'author' | 'moderator' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'banned' | 'deleted';
export type ProfileVisibility = 'public' | 'friends' | 'private';

/**
 * Privacy Settings
 */
export interface PrivacySettings {
  profile_visibility: ProfileVisibility;
  show_email: boolean;
  show_stats: boolean;
  show_psn_id: boolean;
  show_age?: boolean;
  show_social_links?: boolean;
  show_location?: boolean;
}

/**
 * Notification Settings
 */
export interface NotificationSettings {
  newsletter: boolean;
  guide_updates: boolean;
  comments: boolean;
  replies: boolean;
  weekly_digest: boolean;
}

/**
 * Social Links
 */
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

/**
 * Main User Interface
 * Matches the public.users table schema
 */
export interface User {
  // Identity
  id: string; // UUID from auth.users
  email: string;
  username: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;

  // Personal Info
  date_of_birth: string | null; // ISO date string
  bio: string | null;
  country: string | null;
  timezone: string | null;
  language_preference: string;

  // Gaming Info
  psn_id: string | null;
  xbox_gamertag: string | null;
  steam_id: string | null;
  nintendo_id: string | null;
  favorite_platform: string | null;
  favorite_genres: string[] | null;
  gaming_since: number | null;
  categories: string[] | null;

  // Settings (JSONB)
  privacy_settings: PrivacySettings;
  notification_settings: NotificationSettings;
  social_links: SocialLinks;

  // Cached Stats
  total_games_completed: number;
  total_hours_played: number;
  total_platinums: number;

  // System
  last_login: string | null; // ISO timestamp
  email_verified: boolean;
  account_status: AccountStatus;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Public User Profile (safe to share)
 * Excludes sensitive information based on privacy settings
 */
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

/**
 * User Profile Update Data
 */
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

/**
 * User with stats (for admin/self view)
 */
export interface UserWithStats extends User {
  guides_count?: number;
  comments_count?: number;
  likes_received?: number;
}
