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
  buildTvReason,
  buildTvSeriesProfile,
  calibrateTvConfidence,
  filterTvCandidates,
  scoreTvBacklogItem,
  scoreTvDiscoveryCandidate,
  tvIdentitySignalsForProfile,
  type TvSeriesProfile,
} from '../tv/tv-series-engine';

const TV_CLUSTER_PROTOTYPES: ClusterPrototype[] = [
  {
    name: 'prestige character drama',
    requiredGenres: ['drama', 'thriller'],
    minRequiredMatch: 1,
    boostGenres: ['history', 'biography'],
    toneLabels: ['character depth', 'long-form payoff', 'prestige'],
    penaltyGenres: ['children', 'animation'],
    minLibrarySize: 2,
  },
  {
    name: 'mythic fantasy saga',
    requiredGenres: ['fantasy', 'adventure'],
    minRequiredMatch: 2,
    boostGenres: ['drama', 'action'],
    toneLabels: ['mythic', 'world continuity', 'season loyalty'],
    penaltyGenres: ['sitcom'],
    minLibrarySize: 2,
  },
  {
    name: 'slow burn mystery',
    requiredGenres: ['mystery', 'thriller'],
    minRequiredMatch: 1,
    boostGenres: ['drama', 'crime'],
    toneLabels: ['slow burn', 'cliffhanger retention', 'tension'],
    penaltyGenres: ['children', 'family'],
    minLibrarySize: 2,
  },
  {
    name: 'prestige reflective sci-fi',
    requiredGenres: ['science-fiction', 'drama'],
    minRequiredMatch: 1,
    boostGenres: ['mystery', 'thriller'],
    toneLabels: ['reflective sci-fi', 'philosophical', 'long-form'],
    penaltyGenres: ['sitcom'],
    minLibrarySize: 2,
  },
  {
    name: 'crime thriller momentum',
    requiredGenres: ['crime', 'thriller'],
    minRequiredMatch: 2,
    boostGenres: ['mystery', 'drama'],
    toneLabels: ['momentum', 'retention', 'binge'],
    penaltyGenres: ['children', 'animation'],
    minLibrarySize: 2,
  },
];

const TV_TONE_DEFINITIONS: ToneSignalDefinition[] = [
  {
    toneLabel: 'prestige long-form drama',
    genreSignals: ['drama', 'thriller', 'history'],
    clusterSignals: ['prestige character drama'],
    minScore: 7,
  },
  {
    toneLabel: 'mythic world continuity',
    genreSignals: ['fantasy', 'adventure', 'drama'],
    clusterSignals: ['mythic fantasy saga'],
    minScore: 7,
  },
  {
    toneLabel: 'slow burn mystery tension',
    genreSignals: ['mystery', 'thriller', 'crime'],
    clusterSignals: ['slow burn mystery', 'crime thriller momentum'],
    minScore: 7,
  },
  {
    toneLabel: 'reflective sci-fi',
    genreSignals: ['science-fiction', 'drama', 'mystery'],
    clusterSignals: ['prestige reflective sci-fi'],
    minScore: 7,
  },
];

const TV_CONTINUATION_PATTERNS: ContinuationPattern[] = [
  { pattern: /\bSeason\s+\d+\b/i, weight: 0.9 },
  { pattern: /\bPart\s+\d+\b/i, weight: 0.85 },
  { pattern: /\bFinal\s+Season\b/i, weight: 0.9 },
  { pattern: /\bSeries\s+\d+\b/i, weight: 0.8 },
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
const tvProfileCache = new WeakMap<UserScoringContext, TvSeriesProfile>();

export const tvAdapter: CategoryAdapter = {
  category: 'tv',
  clusterPrototypes: TV_CLUSTER_PROTOTYPES,
  toneDefinitions: TV_TONE_DEFINITIONS,
  continuationPatterns: TV_CONTINUATION_PATTERNS,

  async loadData(supabase: SupabaseClient, userId: string): Promise<AdapterLoadResult> {
    const [history, candidates] = await Promise.all([
      loadHistory(supabase, userId),
      loadCandidates(supabase, userId),
    ]);
    return { history, candidates };
  },

  overrideBacklogScore(item, ctx) {
    const profile = getTvProfile(ctx);
    return scoreTvBacklogItem(item, ctx, profile);
  },

  overrideDiscoveryScore(candidate, baseScore, ctx) {
    const profile = getTvProfile(ctx);
    return scoreTvDiscoveryCandidate(candidate, baseScore, profile);
  },

  filterCandidates(candidates, ctx) {
    const profile = getTvProfile(ctx);
    return filterTvCandidates(candidates, ctx, profile);
  },

  postProcess(items, ctx) {
    const profile = getTvProfile(ctx);
    const identitySignals = tvIdentitySignalsForProfile(profile).slice(0, 4).map(signal => signal.name);

    return items.map(item => {
      const enriched = new Set(item.matchedSignals);
      enriched.add('tv series identity profile');
      for (const signal of identitySignals) {
        enriched.add(signal);
      }

      return {
        ...item,
        confidence: calibrateTvConfidence(item, profile),
        reason: buildTvReason(item, profile),
        matchedSignals: Array.from(enriched).slice(0, 6),
      };
    });
  },
};

function getTvProfile(ctx: UserScoringContext): TvSeriesProfile {
  const cached = tvProfileCache.get(ctx);
  if (cached) {
    return cached;
  }
  const profile = buildTvSeriesProfile(ctx.history);
  tvProfileCache.set(ctx, profile);
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
    .eq('media_items.category', 'tv')
    .eq('user_id', userId);

  if (error) {
    console.error('[TvAdapter] Error loading history:', error);
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
      category: row.media_items.category ?? 'tv',
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
    .eq('media_items.category', 'tv');

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
      .eq('category', 'tv')
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
      category: 'tv' as const,
      genres: row.genres ?? [],
      themes: [],
      platforms: [],
      popularityScore: toTvQualityScore(row),
    }));
}

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function toTvQualityScore(row: MediaItemRow): number {
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
