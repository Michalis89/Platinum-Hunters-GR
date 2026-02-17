/**
 * Genre Normalization Layer
 *
 * Hybrid approach:
 * 1. Manual overrides for known problematic genre names (IGDB/RAWG inconsistencies)
 * 2. Automatic slug-based canonicalization for everything else
 *
 * This solves the problem of "Role-playing (RPG)" vs "RPG" vs "Roleplaying"
 */

import type { NormalizedGenre } from '../v2/types';

type GenreOverride = {
  canonicalKey: string;
  displayName: string;
  synonyms: string[];
};

/**
 * Manual overrides for known problematic genres
 * Only include genres that have actual naming conflicts across sources
 */
const GENRE_OVERRIDES: Record<string, GenreOverride> = {
  // RPG variations
  'role-playing-rpg': {
    canonicalKey: 'role-playing-rpg',
    displayName: 'Role-playing (RPG)',
    synonyms: [
      'Role-playing (RPG)',
      'RPG',
      'Roleplaying',
      'Role Playing',
      'Role-Playing',
      'Role-playing',
    ],
  },

  // Hack and slash variations
  'hack-and-slash': {
    canonicalKey: 'hack-and-slash',
    displayName: "Hack and slash/Beat 'em up",
    synonyms: [
      "Hack and slash/Beat 'em up",
      'Hack and slash',
      "Beat 'em up",
      'Beat em up',
      'Brawler',
    ],
  },

  // Strategy variations
  'turn-based-strategy': {
    canonicalKey: 'turn-based-strategy',
    displayName: 'Turn-based strategy (TBS)',
    synonyms: ['Turn-based strategy (TBS)', 'Turn-based strategy', 'TBS', 'Turn Based Strategy'],
  },

  // Real-time strategy
  'real-time-strategy': {
    canonicalKey: 'real-time-strategy',
    displayName: 'Real Time Strategy (RTS)',
    synonyms: ['Real Time Strategy (RTS)', 'Real-time strategy', 'RTS', 'Real Time Strategy'],
  },

  // Platformer variations
  platform: {
    canonicalKey: 'platform',
    displayName: 'Platform',
    synonyms: ['Platform', 'Platformer', 'Platforming'],
  },

  // Adventure variations
  adventure: {
    canonicalKey: 'adventure',
    displayName: 'Adventure',
    synonyms: ['Adventure', 'Point-and-click', 'Point and click'],
  },

  // Shooter variations
  shooter: {
    canonicalKey: 'shooter',
    displayName: 'Shooter',
    synonyms: ['Shooter', 'First-person shooter', 'FPS', 'Third-person shooter', 'TPS'],
  },

  // Sci-Fi variations
  'sci-fi-fantasy': {
    canonicalKey: 'sci-fi-fantasy',
    displayName: 'Sci-Fi & Fantasy',
    synonyms: ['Sci-Fi & Fantasy', 'Sci-Fi', 'Science Fiction', 'Sci Fi', 'SciFi'],
  },

  // Action & Adventure (for TV/Movies)
  'action-adventure': {
    canonicalKey: 'action-adventure',
    displayName: 'Action & Adventure',
    synonyms: ['Action & Adventure', 'Action and Adventure', 'Action/Adventure'],
  },
};

/**
 * Reverse index: synonym -> canonical key
 * Built automatically from GENRE_OVERRIDES
 */
const SYNONYM_TO_CANONICAL = new Map<string, string>();

// Build reverse index
for (const override of Object.values(GENRE_OVERRIDES)) {
  for (const synonym of override.synonyms) {
    const normalizedSynonym = synonym.toLowerCase().trim();
    SYNONYM_TO_CANONICAL.set(normalizedSynonym, override.canonicalKey);
  }
}

/**
 * Canonicalize a string to a slug
 * Used for genres not in the manual override map
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '') // Remove punctuation
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Normalize a genre to its canonical form
 *
 * @param rawGenre - The raw genre string from database
 * @returns NormalizedGenre with canonical key and display name
 */
export function normalizeGenre(rawGenre: string | null | undefined): NormalizedGenre | null {
  if (!rawGenre || typeof rawGenre !== 'string') {
    return null;
  }

  const trimmed = rawGenre.trim();
  if (trimmed === '') {
    return null;
  }

  // Check manual overrides first
  const canonicalKey = SYNONYM_TO_CANONICAL.get(trimmed.toLowerCase());
  if (canonicalKey) {
    const override = GENRE_OVERRIDES[canonicalKey];
    return {
      canonicalKey: override.canonicalKey,
      displayName: override.displayName,
      rawValue: trimmed,
    };
  }

  // Fall back to automatic slug canonicalization
  const slugKey = slugify(trimmed);
  return {
    canonicalKey: slugKey,
    displayName: trimmed, // Keep original as display name
    rawValue: trimmed,
  };
}

/**
 * Normalize an array of genres
 * Filters out null results
 */
export function normalizeGenres(rawGenres: (string | null | undefined)[]): NormalizedGenre[] {
  return rawGenres.map(normalizeGenre).filter((g): g is NormalizedGenre => g !== null);
}

/**
 * Get canonical key from raw genre string
 * Returns null if genre is invalid
 */
export function getCanonicalKey(rawGenre: string | null | undefined): string | null {
  const normalized = normalizeGenre(rawGenre);
  return normalized?.canonicalKey ?? null;
}

/**
 * Get display name for a canonical key
 * Useful for showing genre names in UI
 */
export function getDisplayName(canonicalKey: string): string {
  const override = GENRE_OVERRIDES[canonicalKey];
  if (override) {
    return override.displayName;
  }

  // If not in overrides, capitalize each word
  return canonicalKey
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if two genre strings are equivalent
 */
export function areGenresEquivalent(genre1: string, genre2: string): boolean {
  const key1 = getCanonicalKey(genre1);
  const key2 = getCanonicalKey(genre2);
  return key1 !== null && key2 !== null && key1 === key2;
}
