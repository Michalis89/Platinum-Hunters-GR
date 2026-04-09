/**
 * V3 Recommendation System — Core Types
 *
 * Response contract, shared data types, pipeline interfaces.
 */

// ─── Categories & Sources ────────────────────────────────────────────────────

export type RecommendationCategory = 'games' | 'anime' | 'manga' | 'movies' | 'tv' | 'books';

export type RecommendationSource = 'backlog' | 'continuation' | 'discovery';

// ─── Response Contract ────────────────────────────────────────────────────────

export type RecommendationItem = {
  id: string; // deterministic: `${category}-${mediaDbId}`
  mediaDbId: number;
  title: string;
  cover: string;
  slug: string;
  category: RecommendationCategory;
  source: RecommendationSource;
  confidence: number; // 0–1
  reason: string;
  matchedSignals: string[];
};

export type TasteCluster = {
  name: string;
  weight: number; // 0–1
  signals: string[]; // titles of matched items that drove this cluster
};

export type ToneProfile = {
  primaryTone: string; // e.g. "prestige epic narrative"
  toneLabels: string[]; // e.g. ["emotional depth", "cinematic scale", "authored worlds"]
  confidence: number; // 0–1 (low = sparse library, high = clear signal)
};

export type RecommendationResponse = {
  category: RecommendationCategory;
  tasteProfile: {
    topGenres: Array<{ name: string; weight: number }>;
    topTags: Array<{ name: string; weight: number }>;
    topPlayerStyles?: Array<{ name: string; weight: number }>;
    topPlatforms?: Array<{ name: string; weight: number }>;
    topClusters: TasteCluster[];
    toneProfile: ToneProfile;
    toneSummary: string;
    summary: string;
  };
  fromBacklog: RecommendationItem[]; // max 4
  possibleNext: RecommendationItem[]; // max 4 (continuation-first, discovery fallback)
};

// ─── Media Data Types ─────────────────────────────────────────────────────────

/** Entry from user's library (planned / current / completed / dropped) */
export type MediaHistoryEntry = {
  id: number;
  mediaId: number;
  status: 'planned' | 'current' | 'completed' | 'dropped';
  score: number | null; // 0–10
  progress: number | null;
  priority: number | null; // 0–100
  isFavorite: boolean;
  pinnedRank: number | null;
  updatedAt: string;
  selectedPlatform?: string | null; // Games only
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

/** Candidate from global media_items DB (not yet in user's library) */
export type MediaCandidate = {
  id: number;
  title: string;
  cover: string;
  slug: string;
  category: RecommendationCategory;
  genres: string[];
  themes: string[];
  platforms: string[];
  popularityScore: number; // 0–100
};

// ─── Pipeline Internal Types ──────────────────────────────────────────────────

/** Cluster prototype — provided by each category adapter */
export type ClusterPrototype = {
  name: string;
  /** Genres where at least `minRequiredMatch` must be present */
  requiredGenres: string[];
  minRequiredMatch: number;
  /** Genres that boost cluster score when also present */
  boostGenres: string[];
  /** Tone labels attached to this cluster */
  toneLabels: string[];
  /** Genres that reduce cluster match (aversion signal) */
  penaltyGenres?: string[];
  /** Minimum user library size needed to trust this cluster */
  minLibrarySize?: number;
};

/** Cluster prototype for tone inference */
export type ToneSignalDefinition = {
  toneLabel: string;
  /** Genres that strongly imply this tone */
  genreSignals: string[];
  /** Cluster names that imply this tone */
  clusterSignals: string[];
  /** Score threshold — only high-rated completions count */
  minScore: number;
};

/** Continuation pattern — provided by each category adapter */
export type ContinuationPattern = {
  /** Regex that matches a sequel/follow-up title marker */
  pattern: RegExp;
  /** Confidence weight assigned when this pattern matches */
  weight: number;
};

/** A scored item mid-pipeline, before explanation */
export type ScoredItem = {
  mediaDbId: number;
  title: string;
  cover: string;
  slug: string;
  genres: string[];
  themes: string[];
  platforms: string[];
  source: RecommendationSource;
  rawScore: number; // 0–100
  confidence: number; // 0–1
  clusterMatch: string | null;
  toneMatch: string | null;
  franchiseKey: string | null; // non-null if continuation
  matchedSignals: string[];
  reason: string;
};

/** Extracted taste cluster for a user */
export type ExtractedCluster = {
  prototype: ClusterPrototype;
  weight: number; // 0–1
  evidenceTitles: string[]; // up to 3 titles that drove the weight
};

/** User-level scoring context passed through the pipeline */
export type UserScoringContext = {
  history: MediaHistoryEntry[];
  clusters: ExtractedCluster[];
  toneProfile: ToneProfile;
  topGenres: Array<{ genre: string; weight: number }>;
  topThemes: Array<{ theme: string; weight: number }>;
  topPlayerStyles: Array<{ style: string; weight: number }>;
  topPlatforms: Array<{ platform: string; weight: number }>;
  completionRate: number;
  favoriteRate: number;
  /** Franchise keys the user has completed entry N-1 for */
  completedFranchiseKeys: Set<string>;
  /** Media IDs already in user's library */
  libraryIds: Set<number>;
  /** Canonical genre keys the user has demonstrated aversion to */
  avoidedGenreKeys: Set<string>;
  /** Canonical genre keys from favorites + scores >= 8 */
  loveGenreKeys: Set<string>;
};
