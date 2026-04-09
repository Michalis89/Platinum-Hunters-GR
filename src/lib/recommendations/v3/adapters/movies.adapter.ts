/**
 * Movies Category Adapter
 *
 * Movies-only adapter with core/peripheral taste profiling and strict filtering.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ClusterPrototype,
  ToneSignalDefinition,
  ContinuationPattern,
  MediaHistoryEntry,
  MediaCandidate,
  UserScoringContext,
} from '../types';
import type { CategoryAdapter, AdapterLoadResult } from './adapter.types';
import {
  buildMoviesCinematicProfile,
  buildMoviesReason,
  calibrateMoviesConfidence,
  filterMoviesCandidates,
  movieIdentitySignalsForProfile,
  scoreMoviesBacklogItem,
  scoreMoviesDiscoveryCandidate,
  type MoviesCinematicProfile,
} from '../movies/movies-cinematic-engine';

const MOVIE_CLUSTER_PROTOTYPES: ClusterPrototype[] = [
  {
    name: 'epic fantasy adventure',
    requiredGenres: ['adventure', 'fantasy', 'action'],
    minRequiredMatch: 2,
    boostGenres: ['drama'],
    toneLabels: ['epic', 'mythic', 'adventure'],
    penaltyGenres: ['horror', 'comedy'],
    minLibrarySize: 2,
  },
  {
    name: 'prestige reflective sci-fi',
    requiredGenres: ['sci-fi-fantasy', 'drama', 'thriller'],
    minRequiredMatch: 2,
    boostGenres: ['mystery', 'adventure'],
    toneLabels: ['reflective', 'speculative', 'big ideas'],
    penaltyGenres: ['comedy', 'romance', 'horror'],
    minLibrarySize: 2,
  },
  {
    name: 'emotional human payoff',
    requiredGenres: ['drama'],
    minRequiredMatch: 1,
    boostGenres: ['history', 'biography', 'family', 'romance'],
    toneLabels: ['human', 'emotional', 'character-driven'],
    penaltyGenres: ['horror', 'action'],
    minLibrarySize: 2,
  },
  {
    name: 'mythic hero journey',
    requiredGenres: ['adventure', 'fantasy', 'drama'],
    minRequiredMatch: 2,
    boostGenres: ['action'],
    toneLabels: ['mythic', 'heroic', 'journey'],
    penaltyGenres: ['comedy', 'animation', 'horror'],
    minLibrarySize: 2,
  },
];

const MOVIE_TONE_DEFINITIONS: ToneSignalDefinition[] = [
  {
    toneLabel: 'epic fantasy adventure',
    genreSignals: ['adventure', 'action', 'fantasy'],
    clusterSignals: ['epic fantasy adventure', 'mythic hero journey'],
    minScore: 7,
  },
  {
    toneLabel: 'prestige reflective sci-fi',
    genreSignals: ['sci-fi-fantasy', 'thriller', 'mystery', 'drama'],
    clusterSignals: ['prestige reflective sci-fi'],
    minScore: 7,
  },
  {
    toneLabel: 'emotional human payoff',
    genreSignals: ['drama', 'history', 'biography', 'family'],
    clusterSignals: ['emotional human payoff'],
    minScore: 7,
  },
];

const MOVIE_CONTINUATION_PATTERNS: ContinuationPattern[] = [
  { pattern: /\bPart\s+(II|III|IV|2|3|4)\b/i, weight: 0.9 },
  { pattern: /\bChapter\s+\d+\b/i, weight: 0.85 },
  { pattern: /\bVol\.\s*\d+\b/i, weight: 0.85 },
];

type UserEntryRow = {
  id: number;
  media_id: number;
  status: string;
  score: number | null;
  progress: number | null;
  priority: number | null;
  is_favorite: boolean | null;
  pinned_rank: number | null;
  updated_at: string | null;
  media_items: {
    id: number;
    title_english?: string | null;
    title_romaji?: string | null;
    title?: string | null;
    category: string | null;
    genres: string[] | null;
    cover_url_big: string | null;
    cover_url_thumb: string | null;
    cover_image_large: string | null;
    cover_image_medium: string | null;
  };
};

type MediaItemRow = {
  id: number;
  title_english?: string | null;
  title_romaji?: string | null;
  title?: string | null;
  genres: string[] | null;
  rating?: string | number | null;
  vote_count?: string | number | null;
  popularity?: string | number | null;
  cover_url_big: string | null;
  cover_url_thumb: string | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
};

const PAGE_SIZE = 500;
const moviesProfileCache = new WeakMap<UserScoringContext, MoviesCinematicProfile>();

export const moviesAdapter: CategoryAdapter = {
  category: 'movies',
  clusterPrototypes: MOVIE_CLUSTER_PROTOTYPES,
  toneDefinitions: MOVIE_TONE_DEFINITIONS,
  continuationPatterns: MOVIE_CONTINUATION_PATTERNS,

  async loadData(supabase: SupabaseClient, userId: string): Promise<AdapterLoadResult> {
    const [history, candidates] = await Promise.all([
      loadHistory(supabase, userId),
      loadCandidates(supabase, userId),
    ]);
    return { history, candidates };
  },

  overrideBacklogScore(item, ctx) {
    const profile = getMoviesProfile(ctx);
    return scoreMoviesBacklogItem(item, ctx, profile);
  },

  overrideDiscoveryScore(candidate, baseScore, ctx) {
    const profile = getMoviesProfile(ctx);
    return scoreMoviesDiscoveryCandidate(candidate, baseScore, profile);
  },

  filterCandidates(candidates, ctx) {
    const profile = getMoviesProfile(ctx);
    return filterMoviesCandidates(candidates, ctx, profile);
  },

  postProcess(items, ctx) {
    const profile = getMoviesProfile(ctx);
    const laneSignals = movieIdentitySignalsForProfile(profile).slice(0, 3).map(signal => signal.name);

    return items.map(item => {
      const enrichedSignals = new Set(item.matchedSignals);
      enrichedSignals.add('movie identity profile');
      for (const signal of laneSignals) {
        enrichedSignals.add(signal);
      }
      if (item.franchiseKey) {
        enrichedSignals.add(`selective franchise loyalty (${profile.continuationAffinity})`);
      }

      return {
        ...item,
        confidence: calibrateMoviesConfidence(item, profile),
        reason: buildMoviesReason(item, profile),
        matchedSignals: Array.from(enrichedSignals).slice(0, 6),
      };
    });
  },
};

function getMoviesProfile(ctx: UserScoringContext): MoviesCinematicProfile {
  const cached = moviesProfileCache.get(ctx);
  if (cached) {
    return cached;
  }
  const profile = buildMoviesCinematicProfile(ctx.history);
  moviesProfileCache.set(ctx, profile);
  return profile;
}

async function loadHistory(
  supabase: SupabaseClient,
  userId: string,
): Promise<MediaHistoryEntry[]> {
  const { data, error } = await supabase
    .from('user_media_entries')
    .select(
      `id, media_id, status, score, progress, priority, is_favorite, pinned_rank, updated_at,
       media_items!inner(id, title_english, title_romaji, title, category, genres,
         cover_url_big, cover_url_thumb, cover_image_large, cover_image_medium)`,
    )
    .eq('media_items.category', 'movies')
    .eq('user_id', userId);

  if (error) {
    console.error('[MoviesAdapter] Error loading history:', error);
    return [];
  }

  return ((data ?? []) as unknown as UserEntryRow[]).map(row => ({
    id: row.id,
    mediaId: row.media_id,
    status: row.status as MediaHistoryEntry['status'],
    score: row.score,
    progress: row.progress,
    priority: row.priority,
    isFavorite: row.is_favorite ?? false,
    pinnedRank: row.pinned_rank,
    updatedAt: row.updated_at ?? new Date().toISOString(),
    media: {
      id: row.media_items.id,
      title:
        row.media_items.title_english ??
        row.media_items.title_romaji ??
        row.media_items.title ??
        'Untitled',
      category: row.media_items.category ?? 'movies',
      genres: row.media_items.genres ?? [],
      coverImageLarge: row.media_items.cover_url_big ?? row.media_items.cover_image_large ?? undefined,
      coverImageMedium: row.media_items.cover_url_thumb ?? row.media_items.cover_image_medium ?? undefined,
    },
  }));
}

async function loadCandidates(
  supabase: SupabaseClient,
  userId: string,
): Promise<MediaCandidate[]> {
  const { data: ownedData } = await supabase
    .from('user_media_entries')
    .select('media_id, media_items!inner(category)')
    .eq('user_id', userId)
    .eq('media_items.category', 'movies');

  const ownedIds = new Set((ownedData ?? []).map((r: { media_id: number }) => r.media_id));

  const allRows: MediaItemRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('media_items')
      .select(
        `id, title_english, title_romaji, title, genres, rating, vote_count, popularity,
         cover_url_big, cover_url_thumb, cover_image_large, cover_image_medium`,
      )
      .eq('category', 'movies')
      .order('id', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error || !data || data.length === 0) {
      break;
    }
    allRows.push(...(data as MediaItemRow[]));
    if (data.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }

  return allRows
    .filter(r => !ownedIds.has(r.id))
    .map(row => ({
      id: row.id,
      title: row.title_english ?? row.title_romaji ?? row.title ?? 'Untitled',
      cover: row.cover_url_big ?? row.cover_image_large ?? row.cover_url_thumb ?? '',
      slug: titleToSlug(row.title_english ?? row.title ?? 'untitled'),
      category: 'movies' as const,
      genres: row.genres ?? [],
      themes: [],
      platforms: [],
      popularityScore: toMovieQualityScore(row),
    }));
}

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function toMovieQualityScore(row: MediaItemRow): number {
  const rating = toFiniteNumber(row.rating);
  const voteCount = toFiniteNumber(row.vote_count);
  const popularity = toFiniteNumber(row.popularity);

  const ratingComponent = rating > 0 ? Math.max(0, Math.min(60, ((rating - 5) / 5) * 60)) : 0;
  const voteComponent =
    voteCount > 0 ? Math.max(0, Math.min(25, (Math.log10(voteCount + 1) / 5) * 25)) : 0;
  const popularityComponent =
    popularity > 0 ? Math.max(0, Math.min(15, (Math.min(popularity, 100) / 100) * 15)) : 0;

  return Math.round(Math.max(0, Math.min(100, ratingComponent + voteComponent + popularityComponent)));
}

function toFiniteNumber(input: string | number | null | undefined): number {
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : 0;
  }
  if (typeof input === 'string') {
    const parsed = Number.parseFloat(input);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
