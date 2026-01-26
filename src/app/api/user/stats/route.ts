import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';
import { ok, fail } from '@/lib/api/response';

type CategoryStats = {
  total: number;
  in_progress: number;
  completed: number;
  hours: number;
};

export type PersonalStats = {
  // Summary totals
  total_backlog: number;
  in_progress: number;
  completed: number;
  total_hours: number;
  // Per-category breakdown
  games: CategoryStats;
  anime: CategoryStats;
  manga: CategoryStats & { chapters: number };
  movies: CategoryStats;
  tv: CategoryStats;
  books: CategoryStats & { pages: number };
  // Which categories user has content in
  active_categories: string[];
};

// Average durations for time calculations
const ANIME_EPISODE_MINUTES = 24;
const TV_EPISODE_MINUTES = 45;

/**
 * GET /api/user/stats
 * Returns detailed personal stats for the authenticated user's dashboard
 */
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const userId = session.user.id;

    // Fetch all game entries with hours
    const { data: userGames } = await supabase
      .from('user_games')
      .select('status, actual_hours_casual, actual_hours_platinum')
      .eq('user_id', userId);

    // Fetch all media entries with related media item data for time calculations
    const { data: userMedia } = await supabase
      .from('user_media_entries')
      .select(`
        status,
        progress,
        media_items!inner (
          category,
          episodes,
          duration,
          runtime,
          number_of_episodes,
          page_count,
          chapters
        )
      `)
      .eq('user_id', userId);

    // Calculate game stats
    const gameStats: CategoryStats = { total: 0, in_progress: 0, completed: 0, hours: 0 };
    if (userGames) {
      for (const game of userGames) {
        gameStats.total++;
        if (game.status === 'playing') gameStats.in_progress++;
        if (game.status === 'completed' || game.status === 'platinumed') gameStats.completed++;
        gameStats.hours += (game.actual_hours_casual ?? 0) + (game.actual_hours_platinum ?? 0);
      }
    }

    // Initialize media stats
    const animeStats: CategoryStats = { total: 0, in_progress: 0, completed: 0, hours: 0 };
    const mangaStats: CategoryStats & { chapters: number } = { total: 0, in_progress: 0, completed: 0, hours: 0, chapters: 0 };
    const movieStats: CategoryStats = { total: 0, in_progress: 0, completed: 0, hours: 0 };
    const tvStats: CategoryStats = { total: 0, in_progress: 0, completed: 0, hours: 0 };
    const bookStats: CategoryStats & { pages: number } = { total: 0, in_progress: 0, completed: 0, hours: 0, pages: 0 };

    // Process media entries
    if (userMedia) {
      for (const entry of userMedia) {
        const media = entry.media_items as {
          category: string;
          episodes?: number | null;
          duration?: number | null;
          runtime?: number | null;
          number_of_episodes?: number | null;
          page_count?: number | null;
          chapters?: number | null;
        };

        const isInProgress = entry.status === 'current' || entry.status === 'watching' || entry.status === 'reading';
        const isCompleted = entry.status === 'completed';

        switch (media.category) {
          case 'anime': {
            animeStats.total++;
            if (isInProgress) animeStats.in_progress++;
            if (isCompleted) animeStats.completed++;
            // Calculate watch time: episodes * duration (or default 24 min)
            const episodes = media.episodes ?? 0;
            const duration = media.duration ?? ANIME_EPISODE_MINUTES;
            if (isCompleted) {
              animeStats.hours += (episodes * duration) / 60;
            } else if (isInProgress && entry.progress) {
              animeStats.hours += (entry.progress * duration) / 60;
            }
            break;
          }
          case 'manga': {
            mangaStats.total++;
            if (isInProgress) mangaStats.in_progress++;
            if (isCompleted) mangaStats.completed++;
            if (isCompleted) {
              mangaStats.chapters += media.chapters ?? 0;
            } else if (isInProgress && entry.progress) {
              mangaStats.chapters += entry.progress;
            }
            break;
          }
          case 'movies': {
            movieStats.total++;
            if (entry.status === 'planned') movieStats.in_progress++;
            if (isCompleted) {
              movieStats.completed++;
              movieStats.hours += (media.runtime ?? 120) / 60; // Default 2h for movies
            }
            break;
          }
          case 'tv': {
            tvStats.total++;
            if (isInProgress) tvStats.in_progress++;
            if (isCompleted) tvStats.completed++;
            // Calculate watch time: episodes * average episode duration
            const totalEpisodes = media.number_of_episodes ?? media.episodes ?? 0;
            const episodeDuration = media.runtime ?? TV_EPISODE_MINUTES;
            if (isCompleted) {
              tvStats.hours += (totalEpisodes * episodeDuration) / 60;
            } else if (isInProgress && entry.progress) {
              tvStats.hours += (entry.progress * episodeDuration) / 60;
            }
            break;
          }
          case 'books': {
            bookStats.total++;
            if (isInProgress) bookStats.in_progress++;
            if (isCompleted) {
              bookStats.completed++;
              bookStats.pages += media.page_count ?? 0;
              // Estimate reading time: ~250 words per page, ~200 words per minute
              bookStats.hours += ((media.page_count ?? 0) * 250) / 200 / 60;
            }
            break;
          }
        }
      }
    }

    // Determine active categories
    const activeCategories: string[] = [];
    if (gameStats.total > 0) activeCategories.push('games');
    if (animeStats.total > 0) activeCategories.push('anime');
    if (mangaStats.total > 0) activeCategories.push('manga');
    if (movieStats.total > 0) activeCategories.push('movies');
    if (tvStats.total > 0) activeCategories.push('tv');
    if (bookStats.total > 0) activeCategories.push('books');

    // Calculate totals
    const totalBacklog = gameStats.total + animeStats.total + mangaStats.total +
                         movieStats.total + tvStats.total + bookStats.total;
    const totalInProgress = gameStats.in_progress + animeStats.in_progress + mangaStats.in_progress +
                           movieStats.in_progress + tvStats.in_progress + bookStats.in_progress;
    const totalCompleted = gameStats.completed + animeStats.completed + mangaStats.completed +
                          movieStats.completed + tvStats.completed + bookStats.completed;
    const totalHours = gameStats.hours + animeStats.hours + movieStats.hours +
                       tvStats.hours + bookStats.hours;

    const stats: PersonalStats = {
      total_backlog: totalBacklog,
      in_progress: totalInProgress,
      completed: totalCompleted,
      total_hours: Math.round(totalHours),
      games: {
        ...gameStats,
        hours: Math.round(gameStats.hours),
      },
      anime: {
        ...animeStats,
        hours: Math.round(animeStats.hours),
      },
      manga: {
        ...mangaStats,
        hours: 0, // Manga doesn't have watch time
        chapters: mangaStats.chapters,
      },
      movies: {
        ...movieStats,
        hours: Math.round(movieStats.hours),
      },
      tv: {
        ...tvStats,
        hours: Math.round(tvStats.hours),
      },
      books: {
        ...bookStats,
        hours: Math.round(bookStats.hours),
        pages: bookStats.pages,
      },
      active_categories: activeCategories,
    };

    return ok(stats);
  } catch (error) {
    console.error('User stats error:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}
