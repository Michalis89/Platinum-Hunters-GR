import { withApiRoute } from '@/lib/observability/withApiRoute';

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';
import { ok, fail } from '@/lib/api/response';

type SuggestionType = 'momentum' | 'format' | 'taste' | 'balance';
type SuggestionIcon = 'target' | 'monitor' | 'heart' | 'scale' | 'sparkles';

type SuggestionCard = {
  id: string;
  type: SuggestionType;
  icon: SuggestionIcon;
  title: string;
  explanation: string;
  stat: string;
  supportingText?: string;
  ctaLabel?: string;
};

type EntryRow = {
  status: 'planned' | 'current' | 'completed' | 'dropped' | string;
  score: string | number | null;
  progress: number | null;
  priority: number | null;
  selected_platform: string | null;
  is_favorite: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  media_items: {
    category: string | null;
    genres: string[] | null;
    tags: string[] | null;
  } | null;
};

type DashboardResponse = {
  suggestions: SuggestionCard[];
};

const DAYS_60_MS = 60 * 24 * 60 * 60 * 1000;

function toNumericScore(score: string | number | null): number | null {
  if (typeof score === 'number') {
    return Number.isFinite(score) ? score : null;
  }
  if (typeof score === 'string' && score.trim() !== '') {
    const parsed = Number(score);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function GETHandler() {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const userId = session.user.id;

    const { data: rawEntries, error } = await supabase
      .from('user_media_entries')
      .select(
        `
        status,
        score,
        progress,
        priority,
        selected_platform,
        is_favorite,
        created_at,
        updated_at,
        media_items!inner (
          category,
          genres,
          tags
        )
      `,
      )
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    const entries = Array.isArray(rawEntries) ? (rawEntries as EntryRow[]) : [];

    const now = new Date();
    const last60 = new Date(now.getTime() - DAYS_60_MS);

    const counts = {
      completed: 0,
      dropped: 0,
      current: 0,
      planned: 0,
    };
    let last60Completed = 0;
    let last60Dropped = 0;

    const platformStats = new Map<string, { completed: number; dropped: number; total: number }>();
    const categoryRatings = new Map<
      string,
      { scoreSum: number; scoreCount: number; completed: number; dropped: number }
    >();
    const genreStats = new Map<
      string,
      { completed: number; scoreSum: number; scoreCount: number }
    >();

    entries.forEach(entry => {
      const status = entry.status;
      if (status === 'completed') counts.completed++;
      if (status === 'dropped') counts.dropped++;
      if (status === 'current') counts.current++;
      if (status === 'planned') counts.planned++;

      const updatedAt = entry.updated_at ? new Date(entry.updated_at) : null;
      const createdAt = entry.created_at ? new Date(entry.created_at) : null;
      const referenceDate = updatedAt ?? createdAt;
      if (referenceDate && referenceDate >= last60) {
        if (status === 'completed') {
          last60Completed++;
        }
        if (status === 'dropped') {
          last60Dropped++;
        }
      }

      if (status === 'completed' || status === 'dropped') {
        const platform = entry.selected_platform?.trim();
        if (platform) {
          const stats = platformStats.get(platform) ?? { completed: 0, dropped: 0, total: 0 };
          if (status === 'completed') stats.completed += 1;
          if (status === 'dropped') stats.dropped += 1;
          stats.total = stats.completed + stats.dropped;
          platformStats.set(platform, stats);
        }
      }

      const category = entry.media_items?.category;
      if (category) {
        const score = toNumericScore(entry.score);
        const stats = categoryRatings.get(category) ?? {
          scoreSum: 0,
          scoreCount: 0,
          completed: 0,
          dropped: 0,
        };
        if (status === 'completed') {
          stats.completed += 1;
        }
        if (status === 'dropped') {
          stats.dropped += 1;
        }
        if (score !== null) {
          stats.scoreSum += score;
          stats.scoreCount += 1;
        }
        categoryRatings.set(category, stats);
      }

      if (status === 'completed') {
        const genres = entry.media_items?.genres ?? [];
        genres.forEach(genre => {
          if (!genre) return;
          const normalized = genre.trim();
          if (!normalized) return;
          const genreStat = genreStats.get(normalized) ?? {
            completed: 0,
            scoreSum: 0,
            scoreCount: 0,
          };
          genreStat.completed += 1;
          const score = toNumericScore(entry.score);
          if (score !== null) {
            genreStat.scoreSum += score;
            genreStat.scoreCount += 1;
          }
          genreStats.set(normalized, genreStat);
        });
      }
    });

    const completionDenominator = counts.completed + counts.dropped;
    const completionRate =
      completionDenominator > 0 ? counts.completed / completionDenominator : null;

    const dropRateLast60 =
      last60Completed + last60Dropped > 0
        ? last60Dropped / (last60Completed + last60Dropped)
        : null;

    const completionPercent = completionRate !== null ? Math.round(completionRate * 100) : null;

    const platformCandidates = Array.from(platformStats.entries())
      .map(([platform, stats]) => ({
        platform,
        dropRate: stats.total > 0 ? stats.dropped / stats.total : 0,
        total: stats.total,
      }))
      .filter(item => item.total >= 10);

    const platformByDrop = [...platformCandidates].sort((a, b) => a.dropRate - b.dropRate);
    const platformBest = platformByDrop[0];
    const platformWorst = platformByDrop[platformByDrop.length - 1];

    const categoryDropStats = Array.from(categoryRatings.entries()).map(([category, stats]) => ({
      category,
      dropRate:
        stats.completed + stats.dropped > 0 ? stats.dropped / (stats.completed + stats.dropped) : 0,
      completed: stats.completed,
      dropped: stats.dropped,
    }));

    const categoryByDrop = [...categoryDropStats].sort((a, b) => a.dropRate - b.dropRate);
    const bestCategory = categoryByDrop[0];
    const worstCategory = categoryByDrop[categoryByDrop.length - 1];

    const genreCandidate = [...genreStats.entries()]
      .map(([genre, stats]) => {
        const avgScore = stats.scoreCount ? stats.scoreSum / stats.scoreCount : 0;
        const scoreWeight = 1 + avgScore / 10;
        return {
          genre,
          completed: stats.completed,
          avgScore,
          weight: stats.completed * scoreWeight,
        };
      })
      .sort((a, b) => b.weight - a.weight)[0];

    const categoryScoreEntries = [...categoryRatings.entries()].map(([category, stats]) => ({
      category,
      avgScore: stats.scoreCount ? stats.scoreSum / stats.scoreCount : 0,
      completed: stats.completed,
      scoredCount: stats.scoreCount,
    }));

    const scoredCategory = categoryScoreEntries
      .filter(entry => entry.scoredCount >= 3)
      .sort((a, b) => {
        if (b.avgScore === a.avgScore) {
          return b.completed - a.completed;
        }
        return b.avgScore - a.avgScore;
      })[0];

    const fallbackCategory = categoryScoreEntries.sort((a, b) => b.completed - a.completed)[0];

    const categoryCandidate = scoredCategory ?? fallbackCategory;

    const hasPlatformSignal =
      platformCandidates.length >= 2 &&
      platformBest !== undefined &&
      platformWorst !== undefined &&
      platformWorst.dropRate - platformBest.dropRate >= 0.1;

    const hasCategorySignal =
      categoryByDrop.length >= 2 &&
      bestCategory !== undefined &&
      worstCategory !== undefined &&
      worstCategory.dropRate - bestCategory.dropRate >= 0.1;

    const formatRecommendation = hasPlatformSignal
      ? {
          type: 'platform' as const,
          worst: platformWorst,
          best: platformBest,
        }
      : hasCategorySignal
        ? {
            type: 'category' as const,
            best: bestCategory,
            worst: worstCategory,
          }
        : null;

    const getMomentumSuggestion = (): SuggestionCard => {
      const currentLabel = `${counts.current} current`;
      const completionLabel =
        completionPercent !== null ? `${completionPercent}% finish rate` : 'History still forming';
      const explanation =
        counts.current > 2
          ? `You juggle ${counts.current} active entries while finishing about ${
              completionPercent !== null ? `${completionPercent}%` : 'unknown'
            } of completed versus dropped work; reducing to one or two threads keeps focus.`
          : `You keep ${counts.current} active entries while the completion rate is ${
              completionPercent !== null ? `${completionPercent}%` : 'still forming'
            }; maintaining that focus keeps streaks intact.`;
      return {
        id: 'personal-momentum',
        type: 'momentum',
        icon: 'target',
        title: 'Focus your current entries',
        explanation,
        stat: `${currentLabel} · ${completionLabel}`,
        ctaLabel: 'Review in-progress',
      };
    };

    const getFormatSuggestion = (): SuggestionCard => {
      if (formatRecommendation && formatRecommendation.type === 'platform') {
        const { worst, best } = formatRecommendation;
        const dropRateLabel = `${Math.round(worst.dropRate * 1000) / 10}%`;
        const explanation = `You drop ${dropRateLabel} of your ${worst.platform} entries across ${worst.total} tracked sessions while ${best.platform} stays notably steadier; favor the lower-drop platform for your next start.`;
        return {
          id: 'personal-format-platform',
          type: 'format',
          icon: 'monitor',
          title: 'Favor lower-drop platform',
          explanation,
          stat: `Worst: ${worst.platform} ${dropRateLabel} · ${worst.total} entries`,
          supportingText: `Best: ${best.platform} · ${Math.round(best.dropRate * 1000) / 10}% drop`,
          ctaLabel: 'Pick a platform',
        };
      }

      if (formatRecommendation && formatRecommendation.type === 'category') {
        const { worst, best } = formatRecommendation;
        const worstLabel = `${Math.round(worst.dropRate * 1000) / 10}%`;
        const bestLabel = `${Math.round(best.dropRate * 1000) / 10}%`;
        const explanation = `Your ${worst.category} work drops ${worstLabel} while ${best.category} drops ${bestLabel}, so leaning into the steadier category clarifies the next start.`;
        return {
          id: 'personal-format-category',
          type: 'format',
          icon: 'monitor',
          title: 'Lean into steady formats',
          explanation,
          stat: `${worst.category} ${worstLabel} drop · ${best.category} ${bestLabel} drop`,
          ctaLabel: 'Pick a platform',
        };
      }

      return {
        id: 'personal-format-none',
        type: 'format',
        icon: 'monitor',
        title: 'Track format drops',
        explanation:
          'Platform and category drop data are still warming up; keep logging completions to surface steady formats.',
        stat: 'Awaiting drop patterns',
      };
    };

    const getTasteSuggestion = (): SuggestionCard => {
      if (genreCandidate && genreCandidate.completed > 0) {
        return {
          id: 'personal-taste-genre',
          type: 'taste',
          icon: 'heart',
          title: `Lean into ${genreCandidate.genre}`,
          explanation: `You finish ${genreCandidate.completed} ${genreCandidate.genre} entries averaging ${genreCandidate.avgScore.toFixed(
            1,
          )}, so continuing this streak keeps returns steady.`,
          stat: `${genreCandidate.completed} completions · ${genreCandidate.avgScore.toFixed(1)} avg`,
          ctaLabel: 'Add one more',
        };
      }

      if (categoryCandidate && categoryCandidate.completed > 0) {
        return {
          id: 'personal-taste-category',
          type: 'taste',
          icon: 'heart',
          title: `Lean into ${categoryCandidate.category}`,
          explanation: `You rate ${categoryCandidate.category} entries ${categoryCandidate.avgScore.toFixed(
            1,
          )} on average across ${categoryCandidate.completed} finishes; leaning into them keeps the momentum familiar.`,
          stat: `${categoryCandidate.completed} completed · ${categoryCandidate.avgScore.toFixed(1)} avg`,
          ctaLabel: 'Add one more',
        };
      }

      return {
        id: 'personal-taste-empty',
        type: 'taste',
        icon: 'heart',
        title: 'Refine your taste',
        explanation:
          'Complete a few entries and add scores to surface the strongest genre or category for you right now.',
        stat: 'Awaiting scored completions',
      };
    };

    const getBalanceSuggestion = (): SuggestionCard => {
      if (dropRateLast60 !== null && dropRateLast60 > 0.25) {
        const ratioLabel = `${Math.round(dropRateLast60 * 1000) / 10}%`;
        return {
          id: 'personal-balance-drop',
          type: 'balance',
          icon: 'scale',
          title: 'Balance the churn',
          explanation: `Drops in the last 60 days hit ${ratioLabel}; add a shorter, structured entry to stabilize the streak before starting more.`,
          stat: `60-day drop ${ratioLabel}`,
          ctaLabel: 'Plan a small win',
        };
      }

      if (counts.planned > counts.completed * 2) {
        return {
          id: 'personal-balance-planned',
          type: 'balance',
          icon: 'scale',
          title: 'Balance planned vs done',
          explanation: `You have ${counts.planned} planned entries versus ${counts.completed} completions; finishing one smaller plan first keeps the backlog grounded.`,
          stat: `${counts.planned} planned · ${counts.completed} completed`,
          ctaLabel: 'Plan a small win',
        };
      }

      return {
        id: 'personal-balance-current',
        type: 'balance',
        icon: 'scale',
        title: 'Balance your load',
        explanation: `You currently track ${counts.current} entries—pinning one or two shorter wins keeps clarity as you juggle more starts.`,
        stat: `${counts.current} in-progress`,
        ctaLabel: 'Plan a small win',
      };
    };

    const suggestions: SuggestionCard[] = [
      getMomentumSuggestion(),
      getFormatSuggestion(),
      getTasteSuggestion(),
      getBalanceSuggestion(),
    ];

    return ok<DashboardResponse>({ suggestions });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const GET = withApiRoute(GETHandler);
