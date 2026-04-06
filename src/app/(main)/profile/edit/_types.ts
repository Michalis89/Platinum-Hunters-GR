import type { User } from '@/types/user';

export type CategoryNotes = Record<string, unknown>;

export type ProfileFormData = Partial<User> & {
  categories?: string[];
  category_notes?: CategoryNotes;
  // Legacy fields for UI state (mapped to category_profile in the backend)
  // Game fields (now in profiles.games.*)
  psn_id?: string;
  xbox_gamertag?: string;
  steam_id?: string;
  nintendo_id?: string;
  favorite_platform?: string;
  gaming_since?: number | null;
  // Genre fields (now in profiles.{category}.genres)
  favorite_anime_genres?: string[];
  favorite_movie_genres?: string[];
  favorite_book_genres?: string[];
  // Other category fields
  favorite_languages?: string[];
  pet_types?: string[];
  vape_device?: string;
  vape_flavor?: string;
};

export const EMPTY_CATEGORY_NOTES: CategoryNotes = {};
