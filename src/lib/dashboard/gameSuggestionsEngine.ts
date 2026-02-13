import type { SupabaseClient } from '@supabase/supabase-js';
import type { RawgGame } from '@/lib/rawg/rawgClient';
import { RawgClient } from '@/lib/rawg/rawgClient';

const ENTRY_STATUS_WEIGHTS: Record<string, number> = {
  completed: 1,
  current: 0.85,
  dropped: 0.15,
  planned: 0.05,
};

const EXCLUSION_TOKENS = ['complete', 'edition', 'remaster', 'dlc', 'expansion', 'bundle'];

type EngineParams = {
  supabase: SupabaseClient;
  userId: string;
};

type EntryRow = {
  status: 'planned' | 'current' | 'completed' | 'dropped' | string;
  score: number | string | null;
  progress: number | null;
  is_favorite: boolean | null;
  media_items: {
    rawg_id: number | null;
    genres: string[] | null;
    title: string | null;
  } | null;
};

type GenreMetadata = {
  hours: number;
  dropRate: number;
  favorites: number;
  avgScore: number;
  goodHours: number;
};

export type GameSuggestion = {
  rawgId: number;
  title: string;
  reason: string;
  signals: string;
  confidence: number;
  slug?: string;
};

function normalizeText(value?: string | null) {
  return value ? value.trim().toLowerCase() : '';
}

function clampProbability(value: number) {
  return Math.max(0, Math.min(1, value));
}

function normalizeMapValues(map: Map<string, number>) {
  const values = Array.from(map.values());
  if (!values.length) {
    return new Map<string, number>();
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (Math.abs(max - min) < 1e-6) {
    return new Map(Array.from(map.entries()).map(([key, value]) => [key, value > 0 ? 1 : 0]));
  }
  const range = max - min;
  return new Map(Array.from(map.entries()).map(([key, value]) => [key, (value - min) / range]));
}

function toGenreSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function buildGameSuggestions({ supabase, userId }: EngineParams) {
  const rawgKey = process.env.RAWG_API_KEY ?? '';
  const rawgClient = new RawgClient(rawgKey);

  const { data: entriesData, error } = await supabase
    .from('user_media_entries')
    .select(
      `
      status,
      score,
      progress,
      is_favorite,
      media_items!inner (
        rawg_id,
        genres,
        title
      )
    `,
    )
    .eq('user_id', userId)
    .eq('media_items.category', 'games');

  if (error) {
    throw error;
  }

  const entries = Array.isArray(entriesData) ? (entriesData as unknown as EntryRow[]) : [];

  // REQUIREMENT A & B: Track hours with proper weighting
  const genreHours = new Map<string, number>();
  const genreValue = new Map<string, number>();
  const genreFavorites = new Map<string, number>();
  const genreDropCount = new Map<string, number>();
  const genreTotalCount = new Map<string, number>();
  const genreScoreSum = new Map<string, number>();
  const genreScoreCount = new Map<string, number>();
  const goodHours = new Map<string, number>(); // completed/current weighted hours
  const badHours = new Map<string, number>(); // dropped unweighted hours
  const trackedRawgIds = new Set<number>();
  const droppedRawgIds = new Set<number>();
  const trackedTitles = new Set<string>(); // Track normalized titles to prevent similar games

  entries.forEach(entry => {
    const media = entry.media_items;
    if (!media || !Array.isArray(media.genres)) return;
    const hours = Math.max(0, entry.progress ?? 0);
    const status = entry.status ?? 'planned';
    const rawScoreValue =
      typeof entry.score === 'number' ? entry.score : entry.score ? Number(entry.score) : NaN;
    const score = Number.isFinite(rawScoreValue) ? rawScoreValue : null;
    const statusWeight = ENTRY_STATUS_WEIGHTS[status] ?? 0.05;
    const scoreNorm = score !== null ? clampProbability(score / 10) : 0.6;
    const favBoost = entry.is_favorite ? 1.2 : 1.0;
    const dropMultiplier = status === 'dropped' ? 0.4 : 1;
    // Boost high-rated games: score 10 → 1.5x, score 0 → 0.3x (5x range vs old 1.67x)
    const entryValue = hours * statusWeight * (0.3 + 1.2 * scoreNorm) * favBoost * dropMultiplier;

    const validGenres = media.genres.map(genre => genre?.trim()).filter(Boolean) as string[];
    if (!validGenres.length) return;
    const genreShare = 1 / validGenres.length;

    validGenres.forEach(genre => {
      const normalized = normalizeText(genre);
      if (!normalized) return;

      // REQUIREMENT A: genreHours must be weighted by statusWeight
      const hoursSoFar = genreHours.get(normalized) ?? 0;
      genreHours.set(normalized, hoursSoFar + hours * statusWeight * genreShare);

      const valueSoFar = genreValue.get(normalized) ?? 0;
      genreValue.set(normalized, valueSoFar + entryValue * genreShare);

      if (entry.is_favorite) {
        const favSoFar = genreFavorites.get(normalized) ?? 0;
        genreFavorites.set(normalized, favSoFar + 1);
      }

      const dropSoFar = genreDropCount.get(normalized) ?? 0;
      const totalSoFar = genreTotalCount.get(normalized) ?? 0;

      // REQUIREMENT B: Track goodHours vs badHours per genre
      if (status === 'dropped') {
        genreDropCount.set(normalized, dropSoFar + 1);
        // badHours: dropped hours WITHOUT statusWeight
        badHours.set(normalized, (badHours.get(normalized) ?? 0) + hours * genreShare);
      }

      if (status === 'completed' || status === 'current') {
        // goodHours: completed/current hours WITH statusWeight
        goodHours.set(
          normalized,
          (goodHours.get(normalized) ?? 0) + hours * statusWeight * genreShare,
        );
      }

      genreTotalCount.set(normalized, totalSoFar + 1);

      if (score !== null) {
        const sumSoFar = genreScoreSum.get(normalized) ?? 0;
        genreScoreSum.set(normalized, sumSoFar + score);
        const countSoFar = genreScoreCount.get(normalized) ?? 0;
        genreScoreCount.set(normalized, countSoFar + 1);
      }
    });

    if (media.rawg_id) {
      trackedRawgIds.add(media.rawg_id);
    }
    if (status === 'dropped' && media.rawg_id) {
      droppedRawgIds.add(media.rawg_id);
    }
    // Track normalized title to prevent suggesting similar games (e.g., "The Walking Dead: Season 1" when user has "The Walking Dead")
    if (media.title) {
      const normalizedTitle = normalizeText(media.title);
      if (normalizedTitle) {
        trackedTitles.add(normalizedTitle);
      }
    }
  });

  // REQUIREMENT C: Apply suppression using hours-based drop rate
  const adjustedGenreScore = new Map<string, number>();
  const dropRateMap = new Map<string, number>();

  genreValue.forEach((value, genre) => {
    const good = goodHours.get(genre) ?? 0;
    const bad = badHours.get(genre) ?? 0;
    // dropRateHours[g] = badHours[g] / max(goodHours[g] + badHours[g], 1)
    const dropRateHours = bad / Math.max(good + bad, 1);
    dropRateMap.set(genre, dropRateHours);
    // adjustedGenreScore[g] = genreValue[g] * (1 - 0.8 * dropRateHours[g])
    const penalty = 1 - 0.8 * dropRateHours;
    adjustedGenreScore.set(genre, Math.max(0, value * penalty));
  });

  const normalizedScore = normalizeMapValues(adjustedGenreScore);
  const normalizedHours = normalizeMapValues(genreHours);
  const normalizedFavorites = normalizeMapValues(genreFavorites);

  const finalGenreScore = new Map<string, number>();
  const genreMetadata = new Map<string, GenreMetadata>();

  adjustedGenreScore.forEach((value, genre) => {
    // Calculate average score for this genre
    const avgScore =
      (genreScoreCount.get(genre) ?? 0) > 0
        ? (genreScoreSum.get(genre) ?? 0) / (genreScoreCount.get(genre) ?? 1)
        : 0;

    // Prioritize quality over quantity: 75% quality, 5% hours, 20% favorites
    let finalScore =
      0.75 * (normalizedScore.get(genre) ?? 0) +
      0.05 * (normalizedHours.get(genre) ?? 0) +
      0.2 * (normalizedFavorites.get(genre) ?? 0);

    // ULTRA-AGGRESSIVE quality multiplier: avgScore is the PRIMARY preference signal
    // Make high-rated genres DOMINATE over high-volume genres
    if (avgScore >= 6.0) {
      // EXTREME BOOST: 6.0 → 0.3x, 7.0 → 1.0x, 7.5 → 3.0x, 8.0 → 5.5x, 10.0 → 10.0x
      const qualityMultiplier = 0.3 + 9.7 * ((avgScore - 6.0) / 4.0);
      finalScore *= qualityMultiplier;
    } else {
      // Heavy penalty for poorly-rated genres (avgScore < 6.0)
      finalScore *= 0.2;
    }

    finalGenreScore.set(genre, finalScore);
    genreMetadata.set(genre, {
      hours: genreHours.get(genre) ?? 0,
      dropRate: dropRateMap.get(genre) ?? 0,
      favorites: genreFavorites.get(genre) ?? 0,
      avgScore:
        (genreScoreCount.get(genre) ?? 0) > 0
          ? (genreScoreSum.get(genre) ?? 0) / (genreScoreCount.get(genre) ?? 1)
          : 0,
      goodHours: goodHours.get(genre) ?? 0,
    });
  });

  // REQUIREMENT D: Eligible genres must have goodHours >= 10 AND dropRateHours <= 0.35
  const eligibleGenres = [...finalGenreScore.entries()]
    .filter(([genre]) => {
      const metadata = genreMetadata.get(genre);
      const good = metadata?.goodHours ?? 0;
      const dropRate = metadata?.dropRate ?? 1;
      return good >= 10 && dropRate <= 0.35;
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Debug: Log top genres and eligibility
  const allGenresSorted = [...finalGenreScore.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log('🎮 Top Genres by Score:');
  allGenresSorted.forEach(([genre, score]) => {
    const metadata = genreMetadata.get(genre);
    const good = metadata?.goodHours ?? 0;
    const dropRate = metadata?.dropRate ?? 1;
    const eligible = good >= 10 && dropRate <= 0.35;
    console.log(
      `  ${eligible ? '✅' : '❌'} ${genre}: score=${score.toFixed(3)}, goodHours=${good.toFixed(1)}, dropRate=${(dropRate * 100).toFixed(1)}%, avgScore=${metadata?.avgScore.toFixed(1)}`,
    );
  });
  console.log(`🎯 Eligible genres: ${eligibleGenres.map(([g]) => g).join(', ')}`);

  const genreRanking = eligibleGenres;
  const eligibleGenresSet = new Set(genreRanking.map(([genre]) => genre));

  // Debug: Log tracked titles
  console.log(`📚 Tracked titles (${trackedTitles.size}):`, Array.from(trackedTitles).slice(0, 20).join(', '));

  if (!genreRanking.length) {
    return Array.from({ length: 4 }).map((_, index) => ({
      rawgId: index,
      title: 'More history needed',
      reason: 'Complete more games so we can build personalized picks.',
      signals: 'Awaiting data',
      confidence: 0,
    }));
  }

  const genreSlugs = genreRanking.map(([genre]) => toGenreSlug(genre)).filter(Boolean);

  const rawgGames = await rawgClient.fetchGames({
    genres: genreSlugs.length ? genreSlugs : undefined,
    ordering: '-added',
    pageSize: 60,
  });

  const candidates: Array<{
    game: RawgGame;
    score: number;
    primaryGenre: string;
    reason: string;
    signals: string;
    matchedCount: number;
  }> = [];

  rawgGames.forEach(game => {
    if (!game?.id || trackedRawgIds.has(game.id) || droppedRawgIds.has(game.id)) {
      return;
    }

    const title = normalizeText(game.name);
    if (!title) return;

    // Reject games with similar titles already in library (e.g., "The Walking Dead: Season 1" when user has "The Walking Dead")
    if (trackedTitles.has(title)) {
      console.log(`❌ REJECTED ${game.name}: Already in library (exact title match: "${title}")`);
      return;
    }

    // Debug log to trace title checking
    if (game.name.toLowerCase().includes('horizon')) {
      console.log(`🔍 Checking "${game.name}" → normalized: "${title}" | In tracked? ${trackedTitles.has(title)}`);
    }

    // Also check for partial matches (e.g., both contain "walking-dead")
    const titleWords = title.split('-').filter(w => w.length > 3); // Filter out short words like "the", "of"
    const hasPartialMatch = Array.from(trackedTitles).some(trackedTitle => {
      const trackedWords = trackedTitle.split('-').filter(w => w.length > 3);
      // Check if they share 3+ significant words
      const commonWords = titleWords.filter(w => trackedWords.includes(w));
      return commonWords.length >= 3;
    });
    if (hasPartialMatch) {
      console.log(`❌ REJECTED ${game.name}: Similar title already in library`);
      return;
    }

    if (EXCLUSION_TOKENS.some(token => title.includes(token))) {
      return;
    }

    const candidateGenres = (game.genres ?? [])
      .map(rawgGenre => normalizeText(rawgGenre?.name))
      .filter(Boolean);
    if (!candidateGenres.length) return;

    // Extract tags (like Multiplayer, Co-op, FPS, Shooter) for filtering
    const candidateTags = (game.tags ?? [])
      .map(rawgTag => normalizeText(rawgTag?.name))
      .filter(Boolean)
      .slice(0, 10); // Limit to top 10 tags to avoid noise

    // Combine genres and tags for comprehensive filtering
    const allGameDescriptors = [...candidateGenres, ...candidateTags];

    // REQUIREMENT E: Only consider eligible genres for scoring
    const matchedEligible = candidateGenres.filter(genre => eligibleGenresSet.has(genre));
    if (!matchedEligible.length) return;

    // STRICT FILTER 1: Reject games with heavily dropped genres/tags (dropRate > 45%)
    const heavilyDroppedDescriptors = allGameDescriptors.filter(
      descriptor => (dropRateMap.get(descriptor) ?? 0) > 0.45,
    );
    if (heavilyDroppedDescriptors.length > 0) {
      console.log(
        `❌ REJECTED ${game.name}: Heavily dropped (>45%) → ${heavilyDroppedDescriptors.map(d => `${d}:${((dropRateMap.get(d) ?? 0) * 100).toFixed(1)}%`).join(', ')}`,
      );
      return;
    }

    // STRICT FILTER 2: Reject games with problematic unfamiliar tags
    // Focus on key experience-defining tags (Multiplayer, Co-op, VR, etc.)
    const problematicUnknownTags = ['multiplayer', 'co-op', 'pvp', 'competitive', 'mmo', 'mmorpg', 'battle royale', 'vr', 'online co-op'];
    const foundProblematicUnknownTags = candidateTags.filter(tag => {
      const isProblematic = problematicUnknownTags.includes(tag);
      const isUnknown = !genreHours.has(tag) && !goodHours.has(tag) && !badHours.has(tag);
      return isProblematic && isUnknown;
    });
    if (foundProblematicUnknownTags.length > 0) {
      console.log(
        `❌ REJECTED ${game.name}: Unknown problematic tags → ${foundProblematicUnknownTags.join(', ')}`,
      );
      return;
    }

    // Calculate score only from eligible matched genres
    const genreFit = matchedEligible.reduce(
      (sum, genre) => sum + (finalGenreScore.get(genre) ?? 0),
      0,
    );
    if (genreFit <= 0) return;

    // CUMULATIVE PENALTY: Apply penalty for each genre/tag with dropRate > 30%
    let cumulativePenalty = 0;
    allGameDescriptors.forEach(descriptor => {
      const dropRate = dropRateMap.get(descriptor) ?? 0;
      if (dropRate > 0.3) {
        // Penalty scales with drop rate: 30% → 0.05, 40% → 0.15, 45% → 0.25
        cumulativePenalty += (dropRate - 0.3) * 1.5;
      }
    });

    // STRICT FILTER 3: Heavy penalty for genres with zero engagement
    const zeroEngagementGenres = candidateGenres.filter(genre => {
      const good = goodHours.get(genre) ?? 0;
      return good === 0; // Never played this genre
    });

    if (zeroEngagementGenres.length > 0) {
      // Penalty scales with proportion: 1/2 genres = 0.35, 2/2 genres = 0.70
      const proportion = zeroEngagementGenres.length / candidateGenres.length;
      const zeroEngagementPenalty = 0.7 * proportion;
      cumulativePenalty += zeroEngagementPenalty;
      console.log(
        `⚠️ PENALTY ${game.name}: Zero engagement (${zeroEngagementGenres.length}/${candidateGenres.length}) → ${zeroEngagementGenres.join(', ')} (penalty=${zeroEngagementPenalty.toFixed(2)})`,
      );
    }

    const candidateScore = clampProbability(genreFit - cumulativePenalty);

    // REQUIREMENT E: primaryGenre must be chosen from matched eligible genres with highest finalGenreScore
    const primaryGenre = matchedEligible.sort(
      (a, b) => (finalGenreScore.get(b) ?? 0) - (finalGenreScore.get(a) ?? 0),
    )[0];
    if (!primaryGenre) return;

    const metadata = genreMetadata.get(primaryGenre);
    if (!metadata) return;

    // REQUIREMENT F: Use goodHours for explanation (not total hours)
    const hoursSpent = Math.round(metadata.goodHours);
    const favoriteCount = metadata.favorites;
    const dropRateValue = metadata.dropRate;
    const avgScore = metadata.avgScore;

    // REQUIREMENT F: Only reference hours if goodHours > 0
    if (hoursSpent === 0) return;

    const reason = `You logged ${hoursSpent}h in ${primaryGenre} with avg score ${avgScore.toFixed(
      1,
    )} and favorite weight ${favoriteCount > 0 ? 'boosted' : 'neutral'}, while the drop rate is ${(
      dropRateValue * 100
    ).toFixed(1)}%.`;

    const signals = [primaryGenre, hoursSpent ? `${hoursSpent}h` : null, favoriteCount ? 'favorite' : null]
      .filter(Boolean)
      .join(' · ');

    candidates.push({
      game,
      score: candidateScore,
      primaryGenre,
      reason,
      signals: signals || 'Game pick',
      matchedCount: matchedEligible.length,
    });

    // Debug log for ACCEPTED games with all descriptors
    const descriptorDetails = allGameDescriptors
      .map(d => {
        const dr = dropRateMap.get(d) ?? 0;
        return `${d}:${(dr * 100).toFixed(0)}%`;
      })
      .join(', ');
    console.log(
      `✅ ACCEPTED ${game.name}: score=${candidateScore.toFixed(3)}, primary=${primaryGenre} | All descriptors: [${descriptorDetails}]`,
    );
  });

  const sortedCandidates = candidates.sort((a, b) => b.score - a.score);

  const suggestions: GameSuggestion[] = [];
  const genreUsage = new Map<string, number>();

  for (const candidate of sortedCandidates) {
    if (suggestions.length >= 4) break;

    const usage = genreUsage.get(candidate.primaryGenre) ?? 0;
    const diversityPenalty = usage >= 2 ? 0.15 : 0;

    // REQUIREMENT G: Confidence capped at 0.92
    const baseConfidence = Math.min(0.92, 0.35 + 0.65 * candidate.score);
    let adjustedScore = clampProbability(baseConfidence - diversityPenalty);

    // REQUIREMENT G: Reduce by 0.1 if matched eligible genres count < 2
    if (candidate.matchedCount < 2) {
      adjustedScore = Math.max(0, adjustedScore - 0.1);
    }

    genreUsage.set(candidate.primaryGenre, usage + 1);

    suggestions.push({
      rawgId: candidate.game.id,
      title: candidate.game.name ?? 'Untitled',
      reason: candidate.reason,
      signals: candidate.signals,
      confidence: adjustedScore,
      slug: candidate.game.slug ?? undefined,
    });
  }

  // Fallback suggestions if needed
  if (suggestions.length < 4) {
    const fallback = rawgGames
      .filter(game => game?.id && !trackedRawgIds.has(game.id))
      .slice(0, 4 - suggestions.length);
    fallback.forEach(game => {
      suggestions.push({
        rawgId: game.id,
        title: game.name ?? 'Untitled',
        reason: 'A new candidate based on your history profile.',
        signals: game.genres?.[0]?.name ?? 'Game pick',
        confidence: 0,
        slug: game.slug ?? undefined,
      });
    });
  }

  while (suggestions.length < 4) {
    suggestions.push({
      rawgId: 0,
      title: 'More data needed',
      reason: 'Complete more games so we can personalize your picks.',
      signals: 'Awaiting history',
      confidence: 0,
    });
  }

  return suggestions.slice(0, 4);
}
