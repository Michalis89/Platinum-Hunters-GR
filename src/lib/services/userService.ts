/**
 * User Service
 * Server-side utilities for user data fetching
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type UserBasicInfo = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type UserFullInfo = UserBasicInfo & {
  id: string;
  email: string | null;
  role: string | null;
  roles: string[] | null;
};

/**
 * Fetch basic user info (username, display_name, avatar_url)
 * Used for activity logs and display purposes
 */
export async function getUserBasicInfo(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserBasicInfo | null> {
  const { data, error } = await supabase
    .from('users')
    .select('username, display_name, avatar_url')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user basic info:', error);
    return null;
  }

  return data;
}

/**
 * Fetch full user info including roles
 * Used for permission checks in API routes
 */
export async function getUserFullInfo(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserFullInfo | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, email, role, roles')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user full info:', error);
    return null;
  }

  return data;
}
