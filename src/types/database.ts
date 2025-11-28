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
 * Database schema type for Supabase client
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Partial<User>;
        Update: Partial<User>;
      };
      games: {
        Row: Game;
        Insert: Partial<Game>;
        Update: Partial<Game>;
      };
      guides: {
        Row: Guide;
        Insert: Partial<Guide>;
        Update: Partial<Guide>;
      };
      user_games: {
        Row: UserGameRow;
        Insert: UserGameInsert;
        Update: UserGameUpdate;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
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
