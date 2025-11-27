/**
 * Database Types
 * Auto-generated types for Supabase tables
 * PH-30: User Authentication System
 */

import { User } from './user';

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
      // Add other tables as needed
      games: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      guides: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
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
