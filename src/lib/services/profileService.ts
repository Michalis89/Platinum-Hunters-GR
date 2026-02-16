/**
 * Profile Service
 * Helper functions for reading user profile data with backward compatibility
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@/types/user';
import type { CategoryProfiles } from '@/lib/validation/profile';

export type UserProfileWithExtras = User & {
  location_city: string | null;
  category_profile: CategoryProfiles | null;
};

/**
 * Fetch user profile with backward-compatible location_city and category_profile
 * Prefers new fields but falls back to social_links for compatibility
 */
export async function getUserProfileWithExtras(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserProfileWithExtras | null> {
  // Fetch user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    console.error('Error fetching user profile:', userError);
    return null;
  }

  // Fetch category profile
  const { data: categoryProfile } = await supabase
    .from('user_category_profiles')
    .select('profiles')
    .eq('user_id', userId)
    .single();

  // Parse social_links for backward compatibility
  const socialLinks = (user.social_links as Record<string, unknown>) || {};
  const legacyLocationCity = (socialLinks.location_city as string | undefined) || null;
  const legacyCategoryNotes = (socialLinks.category_notes as CategoryProfiles | undefined) || null;

  return {
    ...user,
    // Prefer new location_city column, fallback to social_links.location_city
    location_city: user.location_city || legacyLocationCity,
    // Prefer new category_profile table, fallback to social_links.category_notes
    category_profile: (categoryProfile?.profiles as CategoryProfiles) || legacyCategoryNotes,
  } as UserProfileWithExtras;
}

/**
 * Get location city for a user (backward compatible)
 */
export async function getUserLocationCity(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: user } = await supabase
    .from('users')
    .select('location_city, social_links')
    .eq('id', userId)
    .single();

  if (!user) return null;

  // Prefer new column
  if (user.location_city) return user.location_city;

  // Fallback to social_links.location_city
  const socialLinks = (user.social_links as Record<string, unknown>) || {};
  return (socialLinks.location_city as string | undefined) || null;
}

/**
 * Get category profile for a user (backward compatible)
 */
export async function getUserCategoryProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<CategoryProfiles | null> {
  // Try new table first
  const { data: categoryProfile } = await supabase
    .from('user_category_profiles')
    .select('profiles')
    .eq('user_id', userId)
    .single();

  if (categoryProfile?.profiles) {
    return categoryProfile.profiles as CategoryProfiles;
  }

  // Fallback to social_links.category_notes
  const { data: user } = await supabase
    .from('users')
    .select('social_links')
    .eq('user_id', userId)
    .single();

  if (!user) return null;

  const socialLinks = (user.social_links as Record<string, unknown>) || {};
  return (socialLinks.category_notes as CategoryProfiles | undefined) || null;
}
