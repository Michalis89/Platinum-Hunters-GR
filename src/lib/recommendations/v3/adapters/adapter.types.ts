/**
 * Category Adapter Interface
 *
 * Each category (games, anime, tv, movies, manga, books) implements this.
 *
 * The adapter provides:
 *   - Category-specific cluster prototypes
 *   - Category-specific tone signal definitions
 *   - Category-specific continuation patterns
 *   - Data loading (Supabase queries are category-specific)
 *   - Optional score overrides
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  RecommendationCategory,
  MediaHistoryEntry,
  MediaCandidate,
  ClusterPrototype,
  ToneSignalDefinition,
  ContinuationPattern,
  ScoredItem,
  UserScoringContext,
} from '../types';

export type AdapterLoadResult = {
  history: MediaHistoryEntry[];
  candidates: MediaCandidate[];
};

export interface CategoryAdapter {
  readonly category: RecommendationCategory;

  /** Cluster prototypes for this category */
  readonly clusterPrototypes: ClusterPrototype[];

  /** Tone signal definitions for this category */
  readonly toneDefinitions: ToneSignalDefinition[];

  /** Extra continuation patterns (regex-based) */
  readonly continuationPatterns: ContinuationPattern[];

  /**
   * Load user's history and DB candidates for this category.
   * Implementations handle category-specific Supabase query fields.
   */
  loadData(supabase: SupabaseClient, userId: string): Promise<AdapterLoadResult>;

  /**
   * Optional: Override backlog scoring for category-specific signals.
   * Return null to use shared pipeline score.
   */
  overrideBacklogScore?(item: MediaHistoryEntry, ctx: UserScoringContext): number | null;

  /**
   * Optional: Override discovery scoring for category-specific signals.
   * Return null to use shared pipeline score.
   */
  overrideDiscoveryScore?(
    candidate: MediaCandidate,
    baseScore: number,
    ctx: UserScoringContext,
  ): number | null;

  /**
   * Optional: Filter candidates before scoring.
   * E.g., games adapter filters by platform.
   */
  filterCandidates?(candidates: MediaCandidate[], ctx: UserScoringContext): MediaCandidate[];

  /**
   * Optional: Apply post-processing to the final ScoredItem list.
   * E.g., inject continuation items that weren't in DB candidates.
   */
  postProcess?(items: ScoredItem[], ctx: UserScoringContext): ScoredItem[];
}
