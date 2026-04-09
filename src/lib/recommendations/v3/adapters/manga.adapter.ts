/**
 * Manga Category Adapter
 *
 * Clusters:
 *   1. battle shounen         — Naruto / One Piece / Bleach pattern
 *   2. dark seinen            — Berserk / Vinland Saga / JJK pattern
 *   3. mystery thriller       — Death Note / Monster / Billy Bat pattern
 *   4. slice of life          — Yotsubato / Aria / Shimanami Tasogare pattern
 *   5. fantasy adventure      — Fullmetal / Seven Deadly Sins pattern
 *   6. romance drama          — Nana / Blue Period / A Silent Voice pattern
 *   7. horror psychological   — Uzumaki / Biomeat / Punpun pattern
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ClusterPrototype,
  ToneSignalDefinition,
  ContinuationPattern,
  MediaHistoryEntry,
  MediaCandidate,
} from '../types';
import type { CategoryAdapter, AdapterLoadResult } from './adapter.types';
import { extractFranchiseKey } from '../utils/franchise';
import { normalizeGenres } from '../utils/genre';

const MANGA_CLUSTER_PROTOTYPES: ClusterPrototype[] = [
  {
    name: 'battle shounen',
    requiredGenres: ['action', 'adventure', 'shounen'],
    minRequiredMatch: 2,
    boostGenres: ['comedy'],
    toneLabels: ['power arcs', 'friendship', 'long-form'],
    penaltyGenres: ['seinen', 'horror', 'psychological'],
    minLibrarySize: 2,
  },
  {
    name: 'dark seinen',
    requiredGenres: ['action', 'drama', 'seinen'],
    minRequiredMatch: 2,
    boostGenres: ['adventure', 'historical'],
    toneLabels: ['dark', 'mature', 'brutal honesty'],
    penaltyGenres: ['shounen', 'comedy', 'romance'],
    minLibrarySize: 2,
  },
  {
    name: 'mystery thriller manga',
    requiredGenres: ['mystery', 'thriller', 'drama'],
    minRequiredMatch: 2,
    boostGenres: ['supernatural', 'psychological'],
    toneLabels: ['cerebral', 'tension', 'dark'],
    penaltyGenres: ['comedy', 'romance', 'slice-of-life'],
    minLibrarySize: 2,
  },
  {
    name: 'slice of life manga',
    requiredGenres: ['slice-of-life', 'comedy'],
    minRequiredMatch: 1,
    boostGenres: ['seinen', 'josei'],
    toneLabels: ['warm', 'introspective', 'slice of life'],
    penaltyGenres: ['action', 'horror'],
    minLibrarySize: 2,
  },
  {
    name: 'fantasy adventure manga',
    requiredGenres: ['fantasy', 'adventure', 'action'],
    minRequiredMatch: 2,
    boostGenres: ['shounen', 'comedy'],
    toneLabels: ['epic', 'adventure', 'power progression'],
    penaltyGenres: ['horror', 'psychological'],
    minLibrarySize: 2,
  },
  {
    name: 'romance drama manga',
    requiredGenres: ['romance', 'drama'],
    minRequiredMatch: 2,
    boostGenres: ['josei', 'seinen'],
    toneLabels: ['emotional', 'heartfelt', 'character-driven'],
    penaltyGenres: ['action', 'horror', 'shounen'],
    minLibrarySize: 2,
  },
];

const MANGA_TONE_DEFINITIONS: ToneSignalDefinition[] = [
  {
    toneLabel: 'dark mature storytelling',
    genreSignals: ['drama', 'seinen', 'action'],
    clusterSignals: ['dark seinen', 'mystery thriller manga', 'horror psychological manga'],
    minScore: 7,
  },
  {
    toneLabel: 'action adventure power arc',
    genreSignals: ['action', 'adventure', 'shounen'],
    clusterSignals: ['battle shounen', 'fantasy adventure manga'],
    minScore: 6,
  },
  {
    toneLabel: 'emotional personal drama',
    genreSignals: ['drama', 'romance', 'slice-of-life'],
    clusterSignals: ['romance drama manga', 'slice of life manga'],
    minScore: 6,
  },
];

const MANGA_CONTINUATION_PATTERNS: ContinuationPattern[] = [
  { pattern: /\bVol(?:ume)?\.?\s*\d+\b/i, weight: 0.9 },
  { pattern: /\bPart\s+\d+\b/i, weight: 0.85 },
  { pattern: /\bChapter\s+\d+\b/i, weight: 0.85 },
];

type UserEntryRow = {
  id: number; media_id: number; status: string; score: number | null;
  progress: number | null; priority: number | null; is_favorite: boolean | null;
  pinned_rank: number | null; updated_at: string | null;
  media_items: {
    id: number; title_english?: string | null; title_romaji?: string | null;
    title?: string | null; category: string | null; genres: string[] | null;
    cover_url_big: string | null; cover_url_thumb: string | null;
    cover_image_large: string | null; cover_image_medium: string | null;
  };
};

type MediaItemRow = {
  id: number; title_english?: string | null; title_romaji?: string | null;
  title?: string | null; genres: string[] | null;
  cover_url_big: string | null; cover_url_thumb: string | null;
  cover_image_large: string | null; cover_image_medium: string | null;
};

const PAGE_SIZE = 500;

type MangaRecommendationMode = 'small-data' | 'full';

type MangaRichnessFlags = {
  enoughEngaged: boolean;
  enoughScored: boolean;
  enoughFavorites: boolean;
  enoughCompleted: boolean;
  enoughFranchiseContinuity: boolean;
  enoughDistinctGenreClusters: boolean;
};

type MangaRichnessSignals = {
  completedCount: number;
  inProgressCount: number;
  scoredItemsCount: number;
  favoritesCount: number;
  franchiseContinuityCount: number;
  distinctGenreClusters: number;
  flags: MangaRichnessFlags;
  satisfiedSignals: number;
};

export const mangaAdapter: CategoryAdapter = {
  category: 'manga',
  clusterPrototypes: MANGA_CLUSTER_PROTOTYPES,
  toneDefinitions: MANGA_TONE_DEFINITIONS,
  continuationPatterns: MANGA_CONTINUATION_PATTERNS,

  async loadData(supabase: SupabaseClient, userId: string): Promise<AdapterLoadResult> {
    const [history, candidates] = await Promise.all([
      loadHistory(supabase, userId),
      loadCandidates(supabase, userId),
    ]);
    return { history, candidates };
  },

  postProcess(items, ctx) {
    const mode = inferMangaRecommendationMode(ctx.history);
    if (mode === 'full') {
      return items;
    }

    return items.map(item => {
      const maxConfidenceBySource: Record<(typeof item)['source'], number> = {
        continuation: 0.9,
        backlog: 0.84,
        discovery: 0.8,
      };
      const minConfidence = 0.5;
      const maxConfidence = maxConfidenceBySource[item.source];
      const calibratedConfidence = Math.max(
        minConfidence,
        Math.min(maxConfidence, item.confidence),
      );

      return {
        ...item,
        confidence: calibratedConfidence,
        matchedSignals: item.matchedSignals.includes('small-data mode calibration')
          ? item.matchedSignals
          : [...item.matchedSignals, 'small-data mode calibration'],
      };
    });
  },
};

export function inferMangaRecommendationMode(
  history: MediaHistoryEntry[],
): MangaRecommendationMode {
  const signals = evaluateMangaRichnessSignals(history);
  return signals.satisfiedSignals >= 3 ? 'full' : 'small-data';
}

export function evaluateMangaRichnessSignals(
  history: MediaHistoryEntry[],
): MangaRichnessSignals {
  const completedCount = history.filter(entry => entry.status === 'completed').length;
  const inProgressCount = history.filter(entry => entry.status === 'current').length;
  const scoredItemsCount = history.filter(
    entry => entry.score !== null && entry.score > 0,
  ).length;
  const favoritesCount = history.filter(entry => entry.isFavorite).length;
  const franchiseContinuityCount = computeFranchiseContinuityCount(history);
  const distinctGenreClusters = computeDistinctGenreClusters(history);

  const flags: MangaRichnessFlags = {
    enoughEngaged: completedCount + inProgressCount >= 8,
    enoughScored: scoredItemsCount >= 5,
    enoughFavorites: favoritesCount >= 2,
    enoughCompleted: completedCount >= 4,
    enoughFranchiseContinuity: franchiseContinuityCount >= 2,
    enoughDistinctGenreClusters: distinctGenreClusters >= 3,
  };

  const satisfiedSignals = Object.values(flags).filter(Boolean).length;

  return {
    completedCount,
    inProgressCount,
    scoredItemsCount,
    favoritesCount,
    franchiseContinuityCount,
    distinctGenreClusters,
    flags,
    satisfiedSignals,
  };
}

function computeFranchiseContinuityCount(history: MediaHistoryEntry[]): number {
  const franchiseCounts = new Map<string, number>();

  for (const entry of history) {
    if (entry.status === 'dropped') {continue;}
    const key = extractFranchiseKey(entry.media.title);
    franchiseCounts.set(key, (franchiseCounts.get(key) ?? 0) + 1);
  }

  return Array.from(franchiseCounts.values()).filter(count => count >= 2).length;
}

function computeDistinctGenreClusters(history: MediaHistoryEntry[]): number {
  const engaged = history.filter(
    entry => entry.status === 'completed' || entry.status === 'current',
  );
  if (engaged.length === 0) {return 0;}

  let matchedClusters = 0;

  for (const prototype of MANGA_CLUSTER_PROTOTYPES) {
    const requiredGenres = normalizeGenres(prototype.requiredGenres);
    if (requiredGenres.length === 0) {continue;}

    const hasMatch = engaged.some(entry => {
      const entryGenres = normalizeGenres(entry.media.genres);
      const overlap = entryGenres.filter(genre => requiredGenres.includes(genre)).length;
      return overlap >= prototype.minRequiredMatch;
    });

    if (hasMatch) {
      matchedClusters += 1;
    }
  }

  return matchedClusters;
}

async function loadHistory(supabase: SupabaseClient, userId: string): Promise<MediaHistoryEntry[]> {
  const { data, error } = await supabase.from('user_media_entries')
    .select(`id, media_id, status, score, progress, priority, is_favorite, pinned_rank, updated_at,
             media_items!inner(id, title_english, title_romaji, title, category, genres,
               cover_url_big, cover_url_thumb, cover_image_large, cover_image_medium)`)
    .eq('media_items.category', 'manga').eq('user_id', userId);
  if (error) { console.error('[MangaAdapter]', error); return []; }
  return ((data ?? []) as unknown as UserEntryRow[]).map(row => ({
    id: row.id, mediaId: row.media_id, status: row.status as MediaHistoryEntry['status'],
    score: row.score, progress: row.progress, priority: row.priority,
    isFavorite: row.is_favorite ?? false, pinnedRank: row.pinned_rank,
    updatedAt: row.updated_at ?? new Date().toISOString(),
    media: {
      id: row.media_items.id,
      title: row.media_items.title_english ?? row.media_items.title_romaji ?? row.media_items.title ?? 'Untitled',
      category: row.media_items.category ?? 'manga', genres: row.media_items.genres ?? [],
      coverImageLarge: row.media_items.cover_url_big ?? row.media_items.cover_image_large ?? undefined,
      coverImageMedium: row.media_items.cover_url_thumb ?? row.media_items.cover_image_medium ?? undefined,
    },
  }));
}

async function loadCandidates(supabase: SupabaseClient, userId: string): Promise<MediaCandidate[]> {
  const { data: ownedData } = await supabase.from('user_media_entries')
    .select('media_id, media_items!inner(category)').eq('user_id', userId).eq('media_items.category', 'manga');
  const ownedIds = new Set((ownedData ?? []).map((r: { media_id: number }) => r.media_id));
  const allRows: MediaItemRow[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.from('media_items')
      .select(`id, title_english, title_romaji, title, genres, cover_url_big, cover_url_thumb, cover_image_large, cover_image_medium`)
      .eq('category', 'manga').order('id', { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
    if (error || !data || data.length === 0) {break;}
    allRows.push(...(data as MediaItemRow[]));
    if (data.length < PAGE_SIZE) {break;}
    offset += PAGE_SIZE;
  }
  return allRows.filter(r => !ownedIds.has(r.id)).map(row => ({
    id: row.id, title: row.title_english ?? row.title_romaji ?? row.title ?? 'Untitled',
    cover: row.cover_url_big ?? row.cover_image_large ?? row.cover_url_thumb ?? '',
    slug: slugify(row.title_english ?? row.title_romaji ?? row.title ?? 'untitled'),
    category: 'manga' as const, genres: row.genres ?? [], themes: [], platforms: [], popularityScore: 0,
  }));
}

function slugify(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
}
