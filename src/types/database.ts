/**
 * Database Types
 * Auto-generated types for Supabase tables
 * PH-30: User Authentication System
 * PH-31: User Games Library System
 */

import { User } from './user';
import { Game, Guide } from './interfaces';

/**
 * User Game status type
 */
export type UserGameStatus = 'to_play' | 'playing' | 'completed' | 'platinumed' | 'dropped';

/**
 * User Games table row type
 */
export interface UserGameRow {
  id: number;
  user_id: string;
  game_id: number;
  status: UserGameStatus;
  priority: number;
  actual_hours_casual: number | null;
  actual_hours_platinum: number | null;
  notes: string | null;
  personal_rating: number | null;
  personal_difficulty: number | null;
  would_recommend: boolean | null;
  is_favorite: boolean | null;
  added_at: string;
  started_at: string | null;
  completed_at: string | null;
  platinumed_at: string | null;
  dropped_at: string | null;
}

/**
 * User Games table insert type
 */
export interface UserGameInsert {
  user_id: string;
  game_id: number;
  status?: UserGameStatus;
  priority?: number;
  actual_hours_casual?: number | null;
  actual_hours_platinum?: number | null;
  notes?: string | null;
  personal_rating?: number | null;
  personal_difficulty?: number | null;
  would_recommend?: boolean | null;
  is_favorite?: boolean | null;
  started_at?: string | null;
  completed_at?: string | null;
  platinumed_at?: string | null;
  dropped_at?: string | null;
}

/**
 * User Games table update type
 */
export interface UserGameUpdate {
  status?: UserGameStatus;
  priority?: number;
  actual_hours_casual?: number | null;
  actual_hours_platinum?: number | null;
  notes?: string | null;
  personal_rating?: number | null;
  personal_difficulty?: number | null;
  would_recommend?: boolean | null;
  is_favorite?: boolean | null;
  started_at?: string | null;
  completed_at?: string | null;
  platinumed_at?: string | null;
  dropped_at?: string | null;
}

/**
 * User Games with Game JOIN result type
 */
export interface UserGameWithGame extends UserGameRow {
  games: Game | Game[] | null;
}

/**
 * Article status type
 */
export type ArticleStatus = 'draft' | 'published' | 'archived';

/**
 * Article category type
 */
export type ArticleCategory = 'gaming' | 'anime' | 'manga' | 'books' | 'movies' | 'tv' | 'coding' | 'pet' | 'vape';

/**
 * Article topic type
 */
export type ArticleTopic = 'articles' | 'reviews' | 'tutorials' | 'guides' | 'weird-cases' | 'care' | 'experiences' | 'health' | 'devices' | 'liquids';

/**
 * Article Row Type
 */
export interface ArticleRow {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  category: ArticleCategory;
  topic: ArticleTopic;
  tags: string[];
  cover_image: string | null;
  content_rich: unknown | null;
  content_html: string | null;
  meta_title: string | null;
  meta_description: string | null;
  author_id: string | null;
  status: ArticleStatus;
  is_featured: boolean;
  views: number;
  likes: number;
  reading_time_minutes: number | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

/**
 * Article Insert Type
 */
export interface ArticleInsert {
  title: string;
  slug: string;
  description?: string | null;
  category: ArticleCategory;
  topic?: ArticleTopic;
  tags?: string[];
  cover_image?: string | null;
  content_rich?: unknown | null;
  content_html?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  author_id: string;
  status?: ArticleStatus;
  is_featured?: boolean;
}

/**
 * Article Update Type
 */
export interface ArticleUpdate {
  title?: string;
  slug?: string;
  description?: string | null;
  category?: ArticleCategory;
  topic?: ArticleTopic;
  tags?: string[];
  cover_image?: string | null;
  content_rich?: unknown | null;
  content_html?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  status?: ArticleStatus;
  is_featured?: boolean;
  published_at?: string | null;
}

/**
 * Activity Log Row Type
 */
export interface ActivityLogRow {
  id: number;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

/**
 * Activity Log Insert Type
 */
export interface ActivityLogInsert {
  user_id: string;
  type: string;
  payload?: Record<string, unknown>;
}

/**
 * Platform Row Type
 */
export interface PlatformRow {
  id: number;
  name: string;
  short_name: string;
  created_at?: string;
}

/**
 * Platform Insert Type
 */
export interface PlatformInsert {
  name: string;
  short_name: string;
}

/**
 * Platform Update Type
 */
export interface PlatformUpdate {
  name?: string;
  short_name?: string;
}

/**
 * Game Platforms Row Type
 */
export interface GamePlatformRow {
  id: number;
  game_id: number;
  platform_id: number;
  created_at?: string;
}

/**
 * Game Platforms Insert Type
 */
export interface GamePlatformInsert {
  game_id: number;
  platform_id: number;
}

/**
 * Game Platforms Update Type
 */
export interface GamePlatformUpdate {
  game_id?: number;
  platform_id?: number;
}

/**
 * Guide Steps Row Type
 */
export interface GuideStepRow {
  id: number;
  guide_id: number;
  step_number: number;
  title: string;
  description: string;
  content_rich: unknown | null;
  content_html: string | null;
  created_at?: string;
  updated_at?: string | null;
}

/**
 * Guide Steps Insert Type
 */
export interface GuideStepInsert {
  guide_id: number;
  step_number: number;
  title: string;
  description: string;
  content_rich?: unknown | null;
  content_html?: string | null;
}

/**
 * Guide Steps Update Type
 */
export interface GuideStepUpdate {
  step_number?: number;
  title?: string;
  description?: string;
  content_rich?: unknown | null;
  content_html?: string | null;
}

/**
 * Media Items (Anime/Manga) Row Type
 */
export interface MediaItemRow {
  id: number;
  mal_id: number | null;
  tmdb_id: number | null;
  imdb_id: string | null;
  google_books_id: string | null;
  category: 'anime' | 'manga' | 'movies' | 'tv' | 'books';
  source: string | null;
  title: string | null;
  original_title: string | null;
  title_english: string | null;
  title_romaji: string | null;
  title_native: string | null;
  description: string | null;
  format: string | null;
  status: string | null;
  season: string | null;
  season_year: number | null;
  episodes: number | null;
  duration: number | null;
  chapters: number | null;
  volumes: number | null;
  release_date: string | null;
  runtime: number | null;
  rating: number | null;
  vote_count: number | null;
  popularity: number | null;
  first_air_date: string | null;
  last_air_date: string | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  page_count: number | null;
  start_date: string | null;
  end_date: string | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
  banner_image: string | null;
  genres: string[] | null;
  tags: unknown[] | null;
  studios: unknown[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * Media Items Insert Type
 */
export interface MediaItemInsert {
  mal_id?: number | null;
  tmdb_id?: number | null;
  imdb_id?: string | null;
  google_books_id?: string | null;
  category: 'anime' | 'manga' | 'movies' | 'tv' | 'books';
  source?: string | null;
  title?: string | null;
  original_title?: string | null;
  title_english?: string | null;
  title_romaji?: string | null;
  title_native?: string | null;
  description?: string | null;
  format?: string | null;
  status?: string | null;
  season?: string | null;
  season_year?: number | null;
  episodes?: number | null;
  duration?: number | null;
  chapters?: number | null;
  volumes?: number | null;
  release_date?: string | null;
  runtime?: number | null;
  rating?: number | null;
  vote_count?: number | null;
  popularity?: number | null;
  first_air_date?: string | null;
  last_air_date?: string | null;
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  page_count?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  cover_image_large?: string | null;
  cover_image_medium?: string | null;
  banner_image?: string | null;
  genres?: string[] | null;
  tags?: unknown[] | null;
  studios?: unknown[] | null;
}

/**
 * Media Items Update Type
 */
export type MediaItemUpdate = Partial<MediaItemInsert>;

/**
 * User Media Entries Row Type
 */
export interface UserMediaEntryRow {
  id: number;
  user_id: string;
  media_id: number;
  status: 'planned' | 'current' | 'completed' | 'dropped';
  is_favorite: boolean | null;
  priority: number | null;
  score: number | null;
  progress: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * User Media Entries Insert Type
 */
export interface UserMediaEntryInsert {
  user_id: string;
  media_id: number;
  status?: 'planned' | 'current' | 'completed' | 'dropped';
  is_favorite?: boolean | null;
  priority?: number | null;
  score?: number | null;
  progress?: number | null;
  notes?: string | null;
}

/**
 * User Media Entries Update Type
 */
export interface UserMediaEntryUpdate {
  status?: 'planned' | 'current' | 'completed' | 'dropped';
  is_favorite?: boolean | null;
  priority?: number | null;
  score?: number | null;
  progress?: number | null;
  notes?: string | null;
}

/**
 * Database schema type for Supabase client
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Partial<User>;
        Update: Partial<User>;
        Relationships: [];
      };
      games: {
        Row: Game;
        Insert: Partial<Game>;
        Update: Partial<Game>;
        Relationships: [];
      };
      guides: {
        Row: Guide;
        Insert: Partial<Guide>;
        Update: Partial<Guide>;
        Relationships: [];
      };
      user_games: {
        Row: UserGameRow;
        Insert: UserGameInsert;
        Update: UserGameUpdate;
        Relationships: [];
      };
      activity_log: {
        Row: ActivityLogRow;
        Insert: ActivityLogInsert;
        Update: Partial<ActivityLogRow>;
        Relationships: [];
      };
      articles: {
        Row: ArticleRow;
        Insert: ArticleInsert;
        Update: ArticleUpdate;
        Relationships: [];
      };
      platforms: {
        Row: PlatformRow;
        Insert: PlatformInsert;
        Update: PlatformUpdate;
        Relationships: [];
      };
      game_platforms: {
        Row: GamePlatformRow;
        Insert: GamePlatformInsert;
        Update: GamePlatformUpdate;
        Relationships: [];
      };
      guide_steps: {
        Row: GuideStepRow;
        Insert: GuideStepInsert;
        Update: GuideStepUpdate;
        Relationships: [];
      };
      media_items: {
        Row: MediaItemRow;
        Insert: MediaItemInsert;
        Update: MediaItemUpdate;
        Relationships: [];
      };
      user_media_entries: {
        Row: UserMediaEntryRow;
        Insert: UserMediaEntryInsert;
        Update: UserMediaEntryUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, { Row: Record<string, unknown>; Relationships: [] }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }> & {
      update_user_last_login: {
        Args: { user_id: string };
        Returns: void;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_admin_or_moderator: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
