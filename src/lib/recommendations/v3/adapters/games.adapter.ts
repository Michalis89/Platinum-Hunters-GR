/**
 * Games Category Adapter
 *
 * The most behavior-aware adapter in the system.
 *
 * Key design decisions:
 *   - Does NOT use genre-first scoring. Clusters dominate.
 *   - "Adventure" is treated as a near-useless signal (nearly every game has it).
 *   - Clusters model actual gameplay styles, not marketing genres.
 *   - Strong multiplayer/live-service aversion detection.
 *   - Platform compatibility filter (optional, based on user's owned platforms).
 *   - Franchise continuation is the highest-value signal for this category.
 *
 * Clusters:
 *   1. cinematic-single-player-aaa     — narrative-first, PS4/PS5-heavy
 *   2. souls-like-mastery              — challenging, methodical, high completion
 *   3. deep-western-rpg                — BG3/Witcher/DA pattern
 *   4. stealth-sandbox                 — Hitman/Assassin's Creed pattern
 *   5. detective-puzzle-adventure      — LA Noire/Batman/puzzle-adventure
 *   6. platform-precision              — Ori/Hollow Knight/platformers
 *   7. survival-crafting               — Valheim/DayZ (aversion signal for this user)
 *   8. multiplayer-live-service        — aversion cluster (penalizes recommendations)
 *   9. open-world-rpg                  — Cyberpunk/Horizon/open world
 *  10. horror-psychological            — horror/psychological genre pattern
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
import { normalizeGenres } from '../utils/genre';

// ─── Cluster Prototypes ───────────────────────────────────────────────────────

const GAME_CLUSTER_PROTOTYPES: ClusterPrototype[] = [
  {
    name: 'cinematic single-player AAA',
    requiredGenres: ['adventure', 'hack-and-slash', 'shooter'],
    minRequiredMatch: 2,
    boostGenres: ['role-playing-rpg', 'shooter'],
    toneLabels: ['authored narrative', 'cinematic scale', 'emotional payoff'],
    penaltyGenres: ['moba', 'real-time-strategy-rts', 'sport'],
    minLibrarySize: 3,
  },
  {
    name: 'souls-like mastery',
    requiredGenres: ['role-playing-rpg', 'hack-and-slash', 'adventure'],
    minRequiredMatch: 2,
    boostGenres: ['hack-and-slash'],
    toneLabels: ['mechanical mastery', 'challenging', 'dark atmosphere'],
    penaltyGenres: ['simulation', 'racing', 'sport', 'moba'],
    minLibrarySize: 2,
  },
  {
    name: 'deep western RPG',
    requiredGenres: ['role-playing-rpg', 'strategy'],
    minRequiredMatch: 1,
    boostGenres: ['adventure', 'tactical'],
    toneLabels: ['narrative depth', 'worldbuilding', 'choice-driven'],
    penaltyGenres: ['shooter', 'sport', 'racing'],
    minLibrarySize: 2,
  },
  {
    name: 'stealth sandbox',
    requiredGenres: ['tactical', 'shooter', 'adventure'],
    minRequiredMatch: 2,
    boostGenres: ['adventure'],
    toneLabels: ['methodical', 'precision', 'player agency'],
    penaltyGenres: ['role-playing-rpg', 'simulation'],
    minLibrarySize: 2,
  },
  {
    name: 'detective adventure',
    requiredGenres: ['adventure', 'point-and-click'],
    minRequiredMatch: 1,
    boostGenres: ['puzzle'],
    toneLabels: ['mystery', 'investigation', 'atmospheric'],
    penaltyGenres: ['moba', 'sport'],
    minLibrarySize: 2,
  },
  {
    name: 'platform precision',
    requiredGenres: ['platform', 'adventure'],
    minRequiredMatch: 1,
    boostGenres: ['puzzle', 'indie'],
    toneLabels: ['precision', 'artistic', 'atmospheric'],
    penaltyGenres: ['shooter', 'sport', 'racing', 'simulation'],
    minLibrarySize: 2,
  },
  {
    name: 'open world RPG',
    requiredGenres: ['role-playing-rpg', 'adventure'],
    minRequiredMatch: 2,
    boostGenres: ['shooter'],
    toneLabels: ['exploration', 'open world', 'authored narrative'],
    penaltyGenres: ['moba', 'real-time-strategy-rts', 'sport'],
    minLibrarySize: 2,
  },
  {
    // Aversion cluster — used to penalize live-service recommendations
    name: 'multiplayer live-service',
    requiredGenres: ['shooter', 'moba'],
    minRequiredMatch: 1,
    boostGenres: ['strategy'],
    toneLabels: ['multiplayer', 'competitive', 'live-service'],
    minLibrarySize: 1,
  },
  {
    // Aversion cluster — survival crafting
    name: 'survival crafting',
    requiredGenres: ['adventure', 'indie'],
    minRequiredMatch: 2,
    boostGenres: ['simulation', 'role-playing-rpg'],
    toneLabels: ['survival', 'crafting', 'sandbox'],
    minLibrarySize: 1,
  },
];

// ─── Tone Signal Definitions ──────────────────────────────────────────────────

const GAME_TONE_DEFINITIONS: ToneSignalDefinition[] = [
  {
    toneLabel: 'narrative immersion',
    genreSignals: ['adventure', 'role-playing-rpg', 'hack-and-slash'],
    clusterSignals: ['cinematic single-player AAA', 'deep western RPG', 'open world RPG'],
    minScore: 7,
  },
  {
    toneLabel: 'dark fantasy challenge',
    genreSignals: ['adventure', 'role-playing-rpg', 'hack-and-slash'],
    clusterSignals: ['souls-like mastery', 'stealth sandbox', 'platform precision'],
    minScore: 7,
  },
  {
    toneLabel: 'cinematic action',
    genreSignals: ['adventure', 'hack-and-slash', 'shooter'],
    clusterSignals: ['cinematic single-player AAA', 'open world RPG'],
    minScore: 8,
  },
  {
    toneLabel: 'choice-driven worldbuilding',
    genreSignals: ['role-playing-rpg', 'strategy', 'tactical'],
    clusterSignals: ['deep western RPG', 'open world RPG'],
    minScore: 6,
  },
];

// ─── Continuation Patterns ────────────────────────────────────────────────────

const GAME_CONTINUATION_PATTERNS: ContinuationPattern[] = [
  { pattern: /\bDLC\b/i, weight: 0.7 },
  { pattern: /\bExpansion\b/i, weight: 0.7 },
  { pattern: /\bPhantom Liberty\b/i, weight: 0.85 },
  { pattern: /\bRebirth\b/i, weight: 0.9 },
  { pattern: /\bScholar of the First Sin\b/i, weight: 0.85 },
  { pattern: /\bForbidden West\b/i, weight: 0.9 },
  { pattern: /\bRagnar[oö]k\b/i, weight: 0.9 },
];

// ─── DB Query Types ───────────────────────────────────────────────────────────

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
  selected_platform: string | null;
  media_items: {
    id: number;
    title: string | null;
    category: string | null;
    genres: string[] | null;
    igdb_themes: string[] | null;
    platforms: string[] | null;
    cover_url_big: string | null;
    cover_url_thumb: string | null;
    cover_image_large: string | null;
    cover_image_medium: string | null;
  };
};

type MediaItemRow = {
  id: number;
  title: string | null;
  igdb_slug: string | null;
  genres: string[] | null;
  igdb_themes: string[] | null;
  platforms: string[] | null;
  cover_url_big: string | null;
  cover_url_thumb: string | null;
  cover_image_large: string | null;
  cover_image_medium: string | null;
};

const PAGE_SIZE = 500;
const MIN_POPULARITY = 3;

// ─── Adapter Implementation ───────────────────────────────────────────────────

export const gamesAdapter: CategoryAdapter = {
  category: 'games',
  clusterPrototypes: GAME_CLUSTER_PROTOTYPES,
  toneDefinitions: GAME_TONE_DEFINITIONS,
  continuationPatterns: GAME_CONTINUATION_PATTERNS,

  async loadData(supabase: SupabaseClient, userId: string): Promise<AdapterLoadResult> {
    const [history, candidates] = await Promise.all([
      loadGameHistory(supabase, userId),
      loadGameCandidates(supabase, userId),
    ]);
    return { history, candidates };
  },

  overrideDiscoveryScore(
    candidate: MediaCandidate,
    baseScore: number,
    ctx: UserScoringContext,
  ): number | null {
    const genres = normalizeGenres(candidate.genres);

    // Hard penalty for multiplayer-first games when user shows single-player preference
    const isSinglePlayerUser = isSinglePlayerPreferenceUser(ctx.history);
    if (isSinglePlayerUser) {
      const multiplayerGenres = ['moba', 'real-time-strategy-rts'];
      if (genres.some(g => multiplayerGenres.includes(g))) {
        return baseScore * 0.4; // aggressive penalty
      }
    }

    // Bonus for single-player authored games
    const hasRPGOrAdventure = genres.includes('role-playing-rpg') || genres.includes('adventure');
    if (isSinglePlayerUser && hasRPGOrAdventure) {
      return Math.min(100, baseScore * 1.15);
    }

    return null; // use default
  },

  filterCandidates(candidates: MediaCandidate[], _ctx: UserScoringContext): MediaCandidate[] {
    // If platform filter was requested, apply it here
    // (Platform context passed through UserScoringContext is available
    // if the adapter stored it; default: no filter)
    return candidates;
  },
};

// ─── Data Loaders ─────────────────────────────────────────────────────────────

async function loadGameHistory(
  supabase: SupabaseClient,
  userId: string,
): Promise<MediaHistoryEntry[]> {
  const { data, error } = await supabase
    .from('user_media_entries')
    .select(
      `id, media_id, status, score, progress, priority, is_favorite, pinned_rank, updated_at,
       selected_platform,
       media_items!inner(id, title, category, genres, igdb_themes, platforms,
         cover_url_big, cover_url_thumb, cover_image_large, cover_image_medium)`,
    )
    .in('media_items.category', ['games', 'game'])
    .eq('user_id', userId);

  if (error) {
    console.error('[GamesAdapter] Error loading history:', error);
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
    selectedPlatform: row.selected_platform,
    media: {
      id: row.media_items.id,
      title: row.media_items.title ?? 'Untitled',
      category: row.media_items.category ?? 'games',
      genres: row.media_items.genres ?? [],
      themes: row.media_items.igdb_themes ?? [],
      platforms: row.media_items.platforms ?? [],
      coverImageLarge:
        row.media_items.cover_url_big ??
        row.media_items.cover_image_large ??
        row.media_items.cover_url_thumb ??
        undefined,
      coverImageMedium: row.media_items.cover_url_thumb ?? row.media_items.cover_image_medium ?? undefined,
    },
  }));
}

async function loadGameCandidates(
  supabase: SupabaseClient,
  userId: string,
): Promise<MediaCandidate[]> {
  // First get the user's library IDs to exclude
  const { data: ownedData } = await supabase
    .from('user_media_entries')
    .select('media_id, media_items!inner(category)')
    .eq('user_id', userId)
    .in('media_items.category', ['games', 'game']);

  const ownedIds = new Set((ownedData ?? []).map((r: { media_id: number }) => r.media_id));

  // Load all game media items in pages
  const allRows: MediaItemRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('media_items')
      .select(
        `id, title, igdb_slug, genres, igdb_themes, platforms,
         cover_url_big, cover_url_thumb, cover_image_large, cover_image_medium`,
      )
      .in('category', ['games', 'game'])
      .order('id', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error || !data || data.length === 0) {break;}

    allRows.push(...(data as MediaItemRow[]));
    if (data.length < PAGE_SIZE) {break;}
    offset += PAGE_SIZE;
  }

  // Exclude owned, load popularity
  const eligible = allRows.filter(r => !ownedIds.has(r.id));
  const eligibleIds = eligible.map(r => r.id);
  const popularityMap = await loadPopularityMap(supabase, eligibleIds);

  return eligible
    .filter(r => (popularityMap.get(r.id) ?? 0) >= MIN_POPULARITY || r.genres?.length)
    .map(row => ({
      id: row.id,
      title: row.title ?? 'Untitled',
      cover:
        row.cover_url_big ??
        row.cover_image_large ??
        row.cover_url_thumb ??
        row.cover_image_medium ??
        '',
      slug: row.igdb_slug ?? titleToSlug(row.title ?? 'untitled'),
      category: 'games' as const,
      genres: row.genres ?? [],
      themes: row.igdb_themes ?? [],
      platforms: row.platforms ?? [],
      popularityScore: popularityMap.get(row.id) ?? 0,
    }));
}

async function loadPopularityMap(
  supabase: SupabaseClient,
  ids: number[],
): Promise<Map<number, number>> {
  if (ids.length === 0) {return new Map();}

  const { data, error } = await supabase
    .from('user_media_entries')
    .select('media_id, status, is_favorite')
    .in('media_id', ids);

  if (error) {return new Map();}

  const stats = new Map<number, { tracked: number; completed: number; favorites: number }>();
  for (const row of data ?? []) {
    const s = stats.get(row.media_id) ?? { tracked: 0, completed: 0, favorites: 0 };
    s.tracked += 1;
    if (row.status === 'completed') {s.completed += 1;}
    if (row.is_favorite) {s.favorites += 1;}
    stats.set(row.media_id, s);
  }

  const result = new Map<number, number>();
  for (const [id, s] of stats.entries()) {
    const score =
      Math.min(50, (s.tracked / 20) * 50) +
      (s.tracked > 0 ? (s.completed / s.tracked) * 30 : 0) +
      (s.tracked > 0 ? (s.favorites / s.tracked) * 20 : 0);
    result.set(id, Math.min(100, score));
  }

  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSinglePlayerPreferenceUser(history: MediaHistoryEntry[]): boolean {
  const completed = history.filter(e => e.status === 'completed');
  if (completed.length < 3) {return true;} // assume single-player until proven otherwise

  const singlePlayerGenres = new Set(['adventure', 'role-playing-rpg', 'hack-and-slash', 'platform', 'puzzle']);
  const multiplayerGenres = new Set(['moba', 'real-time-strategy-rts', 'shooter']);

  let spScore = 0;
  let mpScore = 0;

  for (const entry of completed) {
    const genres = normalizeGenres(entry.media.genres);
    if (genres.some(g => singlePlayerGenres.has(g))) {spScore += 1;}
    if (genres.some(g => multiplayerGenres.has(g))) {mpScore += 1;}
  }

  return spScore > mpScore * 2;
}

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}



