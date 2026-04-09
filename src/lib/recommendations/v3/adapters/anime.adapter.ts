/**
 * Anime Category Adapter
 *
 * Clusters:
 *   1. emotional action        — AoT / Demon Slayer / Jujutsu Kaisen pattern
 *   2. supernatural intensity  — Fullmetal / Death Note / Tokyo Ghoul pattern
 *   3. fantasy world progression — Overlord / Re:Zero / SAO pattern
 *   4. battle shounen          — Naruto / One Piece / Dragon Ball pattern
 *   5. slice of life comfort   — K-On / Shirobako / Barakamon pattern
 *   6. dark psychological      — NGE / Monster / Vinland Saga pattern
 *   7. mecha                   — Code Geass / Gurren Lagann pattern
 *   8. romance drama           — Your Lie in April / Clannad pattern
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

const ANIME_CLUSTER_PROTOTYPES: ClusterPrototype[] = [
  {
    name: 'emotional action',
    requiredGenres: ['action', 'drama'],
    minRequiredMatch: 2,
    boostGenres: ['adventure', 'fantasy'],
    toneLabels: ['emotional stakes', 'intense action', 'character bonds'],
    penaltyGenres: ['comedy', 'slice-of-life'],
    minLibrarySize: 2,
  },
  {
    name: 'supernatural intensity',
    requiredGenres: ['supernatural', 'action', 'drama'],
    minRequiredMatch: 2,
    boostGenres: ['thriller', 'mystery'],
    toneLabels: ['supernatural', 'dark', 'high stakes'],
    penaltyGenres: ['comedy', 'romance'],
    minLibrarySize: 2,
  },
  {
    name: 'fantasy world progression',
    requiredGenres: ['fantasy', 'adventure'],
    minRequiredMatch: 2,
    boostGenres: ['action', 'role-playing-rpg'],
    toneLabels: ['world exploration', 'power progression', 'isekai-adjacent'],
    penaltyGenres: ['horror', 'psychological'],
    minLibrarySize: 2,
  },
  {
    name: 'battle shounen',
    requiredGenres: ['action', 'adventure', 'shounen'],
    minRequiredMatch: 2,
    boostGenres: ['comedy'],
    toneLabels: ['power-up arcs', 'friendship', 'long-running'],
    penaltyGenres: ['psychological', 'horror', 'seinen'],
    minLibrarySize: 2,
  },
  {
    name: 'slice of life comfort',
    requiredGenres: ['slice-of-life', 'comedy'],
    minRequiredMatch: 1,
    boostGenres: ['school', 'music'],
    toneLabels: ['warm', 'comfortable', 'healing'],
    penaltyGenres: ['action', 'horror', 'thriller'],
    minLibrarySize: 2,
  },
  {
    name: 'dark psychological',
    requiredGenres: ['psychological', 'thriller', 'drama'],
    minRequiredMatch: 2,
    boostGenres: ['mystery', 'seinen'],
    toneLabels: ['dark', 'intellectual', 'disturbing'],
    penaltyGenres: ['comedy', 'slice-of-life', 'shounen'],
    minLibrarySize: 2,
  },
  {
    name: 'romance drama',
    requiredGenres: ['romance', 'drama'],
    minRequiredMatch: 2,
    boostGenres: ['music', 'school'],
    toneLabels: ['emotional', 'heartfelt', 'bittersweet'],
    penaltyGenres: ['action', 'horror', 'psychological'],
    minLibrarySize: 2,
  },
];

const ANIME_TONE_DEFINITIONS: ToneSignalDefinition[] = [
  {
    toneLabel: 'intense emotional action',
    genreSignals: ['action', 'drama', 'fantasy'],
    clusterSignals: ['emotional action', 'supernatural intensity'],
    minScore: 7,
  },
  {
    toneLabel: 'dark intellectual',
    genreSignals: ['psychological', 'thriller', 'drama'],
    clusterSignals: ['dark psychological'],
    minScore: 7,
  },
  {
    toneLabel: 'adventure progression',
    genreSignals: ['adventure', 'fantasy', 'action'],
    clusterSignals: ['fantasy world progression', 'battle shounen'],
    minScore: 6,
  },
  {
    toneLabel: 'warm comfort',
    genreSignals: ['slice-of-life', 'comedy'],
    clusterSignals: ['slice of life comfort', 'romance drama'],
    minScore: 6,
  },
];

const ANIME_CONTINUATION_PATTERNS: ContinuationPattern[] = [
  { pattern: /\bSeason\s+\d+\b/i, weight: 0.95 },
  { pattern: /\b(2nd|3rd|4th|Final)\s+Season\b/i, weight: 0.95 },
  { pattern: /\bCour\s+\d+\b/i, weight: 0.9 },
  { pattern: /\bPart\s+\d+\b/i, weight: 0.85 },
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
    title_native?: string | null;
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
  title_native?: string | null;
  title?: string | null;
  genres: string[] | null;
  cover_url_big: string | null;
  cover_url_thumb: string | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
};

const PAGE_SIZE = 500;

export const animeAdapter: CategoryAdapter = {
  category: 'anime',
  clusterPrototypes: ANIME_CLUSTER_PROTOTYPES,
  toneDefinitions: ANIME_TONE_DEFINITIONS,
  continuationPatterns: ANIME_CONTINUATION_PATTERNS,

  async loadData(supabase: SupabaseClient, userId: string): Promise<AdapterLoadResult> {
    const [history, candidates] = await Promise.all([
      loadHistory(supabase, userId),
      loadCandidates(supabase, userId),
    ]);
    return { history, candidates };
  },
};

async function loadHistory(supabase: SupabaseClient, userId: string): Promise<MediaHistoryEntry[]> {
  const { data, error } = await supabase
    .from('user_media_entries')
    .select(
      `id, media_id, status, score, progress, priority, is_favorite, pinned_rank, updated_at,
       media_items!inner(id, title_english, title_romaji, title_native, title, category, genres,
         cover_url_big, cover_url_thumb, cover_image_large, cover_image_medium)`,
    )
    .eq('media_items.category', 'anime')
    .eq('user_id', userId);

  if (error) { console.error('[AnimeAdapter]', error); return []; }

  return ((data ?? []) as unknown as UserEntryRow[]).map(row => ({
    id: row.id, mediaId: row.media_id,
    status: row.status as MediaHistoryEntry['status'],
    score: row.score, progress: row.progress, priority: row.priority,
    isFavorite: row.is_favorite ?? false, pinnedRank: row.pinned_rank,
    updatedAt: row.updated_at ?? new Date().toISOString(),
    media: {
      id: row.media_items.id,
      title: row.media_items.title_english ?? row.media_items.title_romaji ?? row.media_items.title ?? 'Untitled',
      category: row.media_items.category ?? 'anime',
      genres: row.media_items.genres ?? [],
      coverImageLarge: row.media_items.cover_url_big ?? row.media_items.cover_image_large ?? undefined,
      coverImageMedium: row.media_items.cover_url_thumb ?? row.media_items.cover_image_medium ?? undefined,
    },
  }));
}

async function loadCandidates(supabase: SupabaseClient, userId: string): Promise<MediaCandidate[]> {
  const { data: ownedData } = await supabase
    .from('user_media_entries').select('media_id, media_items!inner(category)')
    .eq('user_id', userId).eq('media_items.category', 'anime');
  const ownedIds = new Set((ownedData ?? []).map((r: { media_id: number }) => r.media_id));

  const allRows: MediaItemRow[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.from('media_items')
      .select(`id, title_english, title_romaji, title_native, title, genres,
               cover_url_big, cover_url_thumb, cover_image_large, cover_image_medium`)
      .eq('category', 'anime').order('id', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error || !data || data.length === 0) {break;}
    allRows.push(...(data as MediaItemRow[]));
    if (data.length < PAGE_SIZE) {break;}
    offset += PAGE_SIZE;
  }

  return allRows.filter(r => !ownedIds.has(r.id)).map(row => ({
    id: row.id,
    title: row.title_english ?? row.title_romaji ?? row.title ?? 'Untitled',
    cover: row.cover_url_big ?? row.cover_image_large ?? row.cover_url_thumb ?? '',
    slug: slugify(row.title_english ?? row.title_romaji ?? row.title ?? 'untitled'),
    category: 'anime' as const,
    genres: row.genres ?? [], themes: [], platforms: [], popularityScore: 0,
  }));
}

function slugify(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
}
