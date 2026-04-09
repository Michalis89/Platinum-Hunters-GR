/**
 * Books Category Adapter
 *
 * Clusters:
 *   1. epic fantasy worldbuilding   — Tolkien / Sanderson / ASOIAF pattern
 *   2. literary fiction             — Dostoevsky / Cormac McCarthy pattern
 *   3. sci-fi concepts              — Asimov / PKD / Le Guin pattern
 *   4. thriller mystery             — Gillian Flynn / Stieg Larsson pattern
 *   5. historical drama             — Hilary Mantel / Ken Follett pattern
 *   6. character introspective      — Murakami / Fitzgerald pattern
 *   7. adventure action             — Dumas / Stevenson / Verne pattern
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
  buildBooksReason,
  buildBooksSagaProfile,
  calibrateBooksConfidence,
  filterBooksCandidates,
  scoreBooksBacklogItem,
  scoreBooksDiscoveryCandidate,
  toBooksQualityScore,
  type BooksSagaProfile,
} from '../books/books-saga-engine';

const BOOK_CLUSTER_PROTOTYPES: ClusterPrototype[] = [
  {
    name: 'epic fantasy saga',
    requiredGenres: ['fantasy', 'adventure'],
    minRequiredMatch: 1,
    boostGenres: ['fiction', 'juvenile-fiction'],
    toneLabels: ['saga continuity', 'mythic worldbuilding', 'long-form character arcs'],
    penaltyGenres: ['horror', 'mystery', 'thriller'],
    minLibrarySize: 2,
  },
  {
    name: 'dark hero journey',
    requiredGenres: ['fiction', 'fantasy'],
    minRequiredMatch: 1,
    boostGenres: ['adventure'],
    toneLabels: ['character loyalty', 'arc continuation', 'dark fantasy momentum'],
    penaltyGenres: ['romance', 'comedy'],
    minLibrarySize: 2,
  },
  {
    name: 'forgotten realms dnd world affinity',
    requiredGenres: ['fiction', 'fantasy'],
    minRequiredMatch: 1,
    boostGenres: ['games-activities'],
    toneLabels: ['shared universe continuity', 'world mythology', 'series adjacency'],
    penaltyGenres: ['romance', 'contemporary'],
    minLibrarySize: 2,
  },
  {
    name: 'technical programming learning',
    requiredGenres: ['computers'],
    minRequiredMatch: 1,
    boostGenres: ['technology'],
    toneLabels: ['skill-building', 'applied concepts', 'technical depth'],
    penaltyGenres: ['fiction', 'fantasy'],
    minLibrarySize: 2,
  },
  {
    name: 'ttrpg systems curiosity',
    requiredGenres: ['games-activities'],
    minRequiredMatch: 1,
    boostGenres: ['fiction', 'fantasy'],
    toneLabels: ['systems mastery', 'tabletop world curiosity', 'rulebook affinity'],
    penaltyGenres: ['romance', 'contemporary'],
    minLibrarySize: 2,
  },
];

const BOOK_TONE_DEFINITIONS: ToneSignalDefinition[] = [
  {
    toneLabel: 'saga continuation and world mythology',
    genreSignals: ['fantasy', 'adventure', 'fiction'],
    clusterSignals: ['epic fantasy saga', 'forgotten realms dnd world affinity', 'dark hero journey'],
    minScore: 7,
  },
  {
    toneLabel: 'technical systems learning',
    genreSignals: ['computers', 'technology', 'games-activities'],
    clusterSignals: ['technical programming learning', 'ttrpg systems curiosity'],
    minScore: 7,
  },
];

const BOOK_CONTINUATION_PATTERNS: ContinuationPattern[] = [
  { pattern: /\bBook\s+\d+\b/i, weight: 0.9 },
  { pattern: /\bVolume\s+\d+\b/i, weight: 0.9 },
  { pattern: /\bPart\s+(II|III|IV|2|3|4)\b/i, weight: 0.9 },
];

type UserEntryRow = {
  id: number; media_id: number; status: string; score: number | null;
  progress: number | null; priority: number | null; is_favorite: boolean | null;
  pinned_rank: number | null; updated_at: string | null;
  media_items: {
    id: number; title?: string | null; category: string | null; genres: string[] | null; tags: string[] | null;
    cover_url_big: string | null; cover_url_thumb: string | null;
    cover_image_large: string | null; cover_image_medium: string | null;
  };
};

type MediaItemRow = {
  id: number; title?: string | null; genres: string[] | null; tags: string[] | null;
  rating?: string | number | null; vote_count?: string | number | null; popularity?: string | number | null;
  cover_url_big: string | null; cover_url_thumb: string | null;
  cover_image_large: string | null; cover_image_medium: string | null;
};

const PAGE_SIZE = 500;
const booksProfileCache = new WeakMap<UserScoringContext, BooksSagaProfile>();

export const booksAdapter: CategoryAdapter = {
  category: 'books',
  clusterPrototypes: BOOK_CLUSTER_PROTOTYPES,
  toneDefinitions: BOOK_TONE_DEFINITIONS,
  continuationPatterns: BOOK_CONTINUATION_PATTERNS,

  async loadData(supabase: SupabaseClient, userId: string): Promise<AdapterLoadResult> {
    const [history, candidates] = await Promise.all([
      loadHistory(supabase, userId),
      loadCandidates(supabase, userId),
    ]);
    return { history, candidates };
  },

  overrideBacklogScore(item, ctx) {
    const profile = getBooksProfile(ctx);
    return scoreBooksBacklogItem(item, ctx, profile);
  },

  overrideDiscoveryScore(candidate, baseScore, ctx) {
    const profile = getBooksProfile(ctx);
    return scoreBooksDiscoveryCandidate(candidate, baseScore, profile);
  },

  filterCandidates(candidates, ctx) {
    const profile = getBooksProfile(ctx);
    return filterBooksCandidates(candidates, ctx, profile);
  },

  postProcess(items, ctx) {
    const profile = getBooksProfile(ctx);
    return items.map(item => ({
      ...item,
      confidence: calibrateBooksConfidence(item, profile),
      reason: buildBooksReason(item, profile),
      matchedSignals: Array.from(
        new Set([...item.matchedSignals, 'books saga profile', 'series continuity']),
      ).slice(0, 6),
    }));
  },
};

function getBooksProfile(ctx: UserScoringContext): BooksSagaProfile {
  const cached = booksProfileCache.get(ctx);
  if (cached) {
    return cached;
  }
  const profile = buildBooksSagaProfile(ctx.history);
  booksProfileCache.set(ctx, profile);
  return profile;
}

async function loadHistory(supabase: SupabaseClient, userId: string): Promise<MediaHistoryEntry[]> {
  const { data, error } = await supabase.from('user_media_entries')
    .select(`id, media_id, status, score, progress, priority, is_favorite, pinned_rank, updated_at,
             media_items!inner(id, title, category, genres, tags,
               cover_url_big, cover_url_thumb, cover_image_large, cover_image_medium)`)
    .eq('media_items.category', 'books').eq('user_id', userId);
  if (error) { console.error('[BooksAdapter]', error); return []; }
  return ((data ?? []) as unknown as UserEntryRow[]).map(row => ({
    id: row.id, mediaId: row.media_id, status: row.status as MediaHistoryEntry['status'],
    score: row.score, progress: row.progress, priority: row.priority,
    isFavorite: row.is_favorite ?? false, pinnedRank: row.pinned_rank,
    updatedAt: row.updated_at ?? new Date().toISOString(),
    media: {
      id: row.media_items.id, title: row.media_items.title ?? 'Untitled',
      category: row.media_items.category ?? 'books', genres: row.media_items.genres ?? [],
      themes: row.media_items.tags ?? [],
      coverImageLarge: row.media_items.cover_url_big ?? row.media_items.cover_image_large ?? undefined,
      coverImageMedium: row.media_items.cover_url_thumb ?? row.media_items.cover_image_medium ?? undefined,
    },
  }));
}

async function loadCandidates(supabase: SupabaseClient, userId: string): Promise<MediaCandidate[]> {
  const { data: ownedData } = await supabase.from('user_media_entries')
    .select('media_id, media_items!inner(category)').eq('user_id', userId).eq('media_items.category', 'books');
  const ownedIds = new Set((ownedData ?? []).map((r: { media_id: number }) => r.media_id));
  const allRows: MediaItemRow[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.from('media_items')
      .select(`id, title, genres, tags, rating, vote_count, popularity, cover_url_big, cover_url_thumb, cover_image_large, cover_image_medium`)
      .eq('category', 'books').order('id', { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
    if (error || !data || data.length === 0) {break;}
    allRows.push(...(data as MediaItemRow[]));
    if (data.length < PAGE_SIZE) {break;}
    offset += PAGE_SIZE;
  }
  return allRows.filter(r => !ownedIds.has(r.id)).map(row => ({
    id: row.id, title: row.title ?? 'Untitled',
    cover: row.cover_url_big ?? row.cover_image_large ?? row.cover_url_thumb ?? '',
    slug: slugify(row.title ?? 'untitled'), category: 'books' as const,
    genres: row.genres ?? [], themes: row.tags ?? [], platforms: [],
    popularityScore: toBooksQualityScore(
      row.rating,
      row.vote_count,
      row.popularity,
      Array.isArray(row.genres) && row.genres.length > 0,
      Array.isArray(row.tags) && row.tags.length > 0,
    ),
  }));
}

function slugify(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
}
