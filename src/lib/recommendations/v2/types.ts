/**
 * V2 Recommendation System Types
 * Data-driven, adaptive approach
 */

export type RecommendationCategory = 'games' | 'anime' | 'manga' | 'movies' | 'tv' | 'books';
export type RecommendationSource = 'backlog' | 'database' | 'database-fallback';

/**
 * Normalized genre with canonical key
 */
export type NormalizedGenre = {
  canonicalKey: string;
  displayName: string;
  rawValue: string;
};

/**
 * A single recommendation result
 */
export type Recommendation = {
  mediaId: number;
  category: RecommendationCategory;
  title: string;
  cover: string;
  slug: string;
  reason: string;
  confidence: number;
  source: RecommendationSource;
  genres?: string[];
  tags?: string[];
  primaryGenre?: string;
  score: number;
};

/**
 * Genre coverage statistics
 * Calculated dynamically from database
 */
export type GenreCoverage = {
  genre: string;
  itemCount: number;
  totalItems: number;
  coverage: number; // itemCount / totalItems
  isGeneric: boolean; // coverage > 0.6
};

/**
 * Genre quality signal from user's history
 */
export type GenreQualitySignal = {
  genre: string;
  completionRate: number; // completed / (completed + current + dropped)
  avgRating: number | null; // Average rating (0-10)
  normalizedAvgRating: number; // avgRating / 10 (0-1)
  favoriteRate: number; // favorites / total_items
  qualityScore: number; // Weighted combination
  totalItems: number;
  completedItems: number;
  favoriteItems: number;
};

/**
 * User's genre affinity from database
 */
export type UserGenreAffinity = {
  genre: string;
  score: number;
  itemCount: number;
  strongSignalCount: number;
  signalRatio: number; // strongSignalCount / itemCount
};

/**
 * Avoided genre
 */
export type AvoidedGenre = {
  genre: string;
  droppedCount: number;
  completedCount: number;
  completionRatio: number; // completed / (completed + dropped)
  isAvoided: boolean; // dropped >= 3 AND completionRatio < 0.4
};

/**
 * User media entry
 */
export type UserMediaEntry = {
  id: number;
  mediaId: number;
  status: 'planned' | 'current' | 'completed' | 'dropped';
  score: number | null;
  progress: number | null;
  priority: number | null;
  isFavorite: boolean;
  pinnedRank: number | null;
  updatedAt: string;
  media: {
    id: number;
    title: string;
    category: string;
    genres: string[];
    themes?: string[];
    platforms?: string[];
    coverImageLarge?: string;
    coverImageMedium?: string;
  };
};

/**
 * Enhanced user preferences with quality signals
 */
export type UserPreferences = {
  // Genre affinities (canonical key -> affinity data)
  genreAffinities: Map<string, UserGenreAffinity>;

  // Genre quality signals (canonical key -> quality data)
  genreQualities: Map<string, GenreQualitySignal>;

  // Theme affinities
  themeAffinities: Map<string, number>;

  // Avoided genres
  avoidedGenres: Map<string, AvoidedGenre>;

  // Platform preferences
  favoritePlatform: string | null;
  secondFavoritePlatform: string | null;

  // Recent activity
  recentGenres: Set<string>;
};

/**
 * Genre weights (dynamic based on generic detection)
 */
export type GenreWeights = {
  primary: number;
  secondary: number;
  tertiary: number;
};

/**
 * Scored candidate for recommendation
 */
export type ScoredCandidate = {
  mediaId: number;
  title: string;
  cover: string;
  slug: string;
  category: RecommendationCategory;
  genres: string[];
  themes: string[];
  platforms: string[];

  // Scoring breakdown
  genreScore: number;
  themeScore: number;
  platformBoost: number;
  finalScore: number;

  // Metadata
  primaryGenre: string;
  secondaryGenre?: string;
  usedSecondaryPriority: boolean; // True if we flipped weights
  matchedGenres: string[];
  matchReason: string;
};

/**
 * Priority tier for backlog items
 */
export type PriorityTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Backlog item with scoring
 */
export type ScoredBacklogItem = {
  entry: UserMediaEntry;
  priorityTier: PriorityTier;
  genreScore: number;
  platformBoost: number;
  finalScore: number;
  reason: string;
  usedSecondaryPriority: boolean;
};
