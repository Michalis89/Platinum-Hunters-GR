import { z } from 'zod';

/**
 * Validation schemas for user profile data refactor
 * Safe, non-breaking approach with backward compatibility
 */

// =====================================================
// Social Links (Allowed Keys Only)
// =====================================================
export const ALLOWED_SOCIAL_LINK_KEYS = [
  'reddit',
  'twitch',
  'discord',
  'twitter',
  'website',
  'youtube',
  'instagram',
] as const;

export const socialLinksSchema = z.object({
  reddit: z.string().optional(),
  twitch: z.string().optional(),
  discord: z.string().optional(),
  twitter: z.string().optional(),
  website: z.string().optional(),
  youtube: z.string().optional(),
  instagram: z.string().optional(),
});

export type SocialLinks = z.infer<typeof socialLinksSchema>;

// =====================================================
// Location City
// =====================================================
export const locationCitySchema = z.string().max(100).nullable();

export type LocationCity = z.infer<typeof locationCitySchema>;

// =====================================================
// Category Profile Patch (Partial Updates)
// =====================================================
// Games category profile
export const gamesProfileSchema = z
  .object({
    psn_id: z.string().optional(),
    xbox_gamertag: z.string().optional(),
    steam_id: z.string().optional(),
    nintendo_id: z.string().optional(),
    favorite_platform: z.string().optional(),
    gaming_since: z.number().nullable().optional(),
    user_favorite_genres: z.array(z.string()).optional(),
  })
  .passthrough();

// Anime/Manga category profile
export const animeProfileSchema = z
  .object({
    genres: z.array(z.string()).optional(),
    mal_username: z.string().optional(),
  })
  .passthrough();

// Movies/TV category profile
export const moviesProfileSchema = z
  .object({
    genres: z.array(z.string()).optional(),
  })
  .passthrough();

// Books category profile
export const booksProfileSchema = z
  .object({
    genres: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
  })
  .passthrough();

// Coding category profile
export const codingProfileSchema = z
  .object({
    languages: z.array(z.string()).optional(),
  })
  .passthrough();

// Pet category profile
export const petProfileSchema = z
  .object({
    entries: z.record(z.string(), z.record(z.string(), z.string())).optional(),
  })
  .passthrough();

// Vape category profile
export const vapeProfileSchema = z
  .object({
    device: z.string().optional(),
    flavors: z.array(z.string()).optional(),
    nicotine: z.string().optional(),
    since: z.union([z.string(), z.number()]).optional(),
    notes: z.string().optional(),
  })
  .passthrough();

// Full category profiles map
export const categoryProfilesSchema = z.object({
  games: gamesProfileSchema.optional(),
  anime: animeProfileSchema.optional(),
  manga: animeProfileSchema.optional(),
  movies: moviesProfileSchema.optional(),
  tv: moviesProfileSchema.optional(),
  books: booksProfileSchema.optional(),
  coding: codingProfileSchema.optional(),
  pet: petProfileSchema.optional(),
  vape: vapeProfileSchema.optional(),
});

export type CategoryProfiles = z.infer<typeof categoryProfilesSchema>;

// Partial update (for PATCH endpoints)
export const categoryProfilePatchSchema = categoryProfilesSchema.partial();

export type CategoryProfilePatch = z.infer<typeof categoryProfilePatchSchema>;

// =====================================================
// Helper: Sanitize Social Links (Strip Non-Allowed Keys)
// =====================================================
export function sanitizeSocialLinks(input: Record<string, unknown>): SocialLinks {
  const sanitized: Partial<SocialLinks> = {};

  for (const key of ALLOWED_SOCIAL_LINK_KEYS) {
    const value = input[key];
    if (typeof value === 'string' && value.trim()) {
      sanitized[key] = value.trim();
    }
  }

  return sanitized as SocialLinks;
}

// =====================================================
// Helper: Deep Merge Category Profiles
// =====================================================
export function mergeCategoryProfiles(
  existing: CategoryProfiles,
  patch: CategoryProfilePatch,
): CategoryProfiles {
  const merged = { ...existing };

  for (const [category, updates] of Object.entries(patch)) {
    if (updates && typeof updates === 'object') {
      merged[category as keyof CategoryProfiles] = {
        ...(existing[category as keyof CategoryProfiles] || {}),
        ...updates,
      };
    }
  }

  return merged;
}
