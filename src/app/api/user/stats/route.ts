import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { API_ERRORS } from '@/lib/api/errors';
import { ok, fail } from '@/lib/api/response';

type CategoryStats = {
  total: number;
  in_progress: number;
  completed: number;
  dropped: number;
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

type StatsEntry = {
  status: string;
  progress: number | null;
  media_items: {
    category: string | null;
    runtime: number | null;
    duration: number | null;
    episodes: number | null;
    number_of_episodes: number | null;
    page_count: number | null;
    chapters: number | null;
    volumes: number | null;
  } | null;
};

/**
 * GET /api/user/stats
 * Returns detailed personal stats for the authenticated user's dashboard
 */
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);
    const userId = session.user.id;

    const { data: entries, error } = await supabase
      .from('user_media_entries')
      .select(
        `
        status,
        progress,
        media_items!inner (
          category,
          runtime,
          duration,
          episodes,
          number_of_episodes,
          page_count,
          chapters,
          volumes
        )
      `,
      )
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    const statsEntries = Array.isArray(entries) ? (entries as StatsEntry[]) : [];

  const gameStats: CategoryStats = { total: 0, in_progress: 0, completed: 0, dropped: 0, hours: 0 };
  const animeStats: CategoryStats = { total: 0, in_progress: 0, completed: 0, dropped: 0, hours: 0 };
  const mangaStats: CategoryStats & { chapters: number } = {
    total: 0,
    in_progress: 0,
    completed: 0,
    dropped: 0,
    hours: 0,
    chapters: 0,
  };
    const movieStats: CategoryStats = { total: 0, in_progress: 0, completed: 0, dropped: 0, hours: 0 };
    const tvStats: CategoryStats = { total: 0, in_progress: 0, completed: 0, dropped: 0, hours: 0 };
  const bookStats: CategoryStats & { pages: number } = {
    total: 0,
    in_progress: 0,
    completed: 0,
    dropped: 0,
    hours: 0,
    pages: 0,
  };

    for (const entry of statsEntries) {
      const media = entry.media_items;
      if (!media || !media.category) continue;

      const normalizedCategory = media.category;
      const status = entry.status;
      const isCompleted = status === 'completed';
      const isInProgress =
        normalizedCategory === 'movies' ? status === 'planned' : status === 'current';

       const isDropped = status === 'dropped';
       switch (normalizedCategory) {
        case 'games': {
          gameStats.total++;
          if (isInProgress) gameStats.in_progress++;
          if (isCompleted) gameStats.completed++;
          if (isDropped) gameStats.dropped++;
          gameStats.hours += entry.progress ?? 0;
          break;
        }
        case 'anime': {
          animeStats.total++;
          if (isInProgress) animeStats.in_progress++;
          if (isCompleted) animeStats.completed++;
          if (isDropped) animeStats.dropped++;
          const duration = media.duration ?? ANIME_EPISODE_MINUTES;
          const totalEpisodes = media.number_of_episodes ?? media.episodes ?? 0;
          if (isCompleted) {
            animeStats.hours += (totalEpisodes * duration) / 60;
          } else if (isInProgress && entry.progress) {
            animeStats.hours += (entry.progress * duration) / 60;
          }
          break;
        }
        case 'manga': {
          mangaStats.total++;

          if (isInProgress) mangaStats.in_progress++;
          if (isCompleted) mangaStats.completed++;
          if (isDropped) mangaStats.dropped++;

          const volumesRead = isCompleted ? (media.volumes ?? 0) : (entry.progress ?? 0);

          mangaStats.chapters += volumesRead;

          const AVG_PAGES_PER_VOLUME = 220;
          const MANGA_PAGES_PER_HOUR = 55; // Manga reading speed

          const basePages = volumesRead * AVG_PAGES_PER_VOLUME;

          mangaStats.hours += basePages > 0 ? basePages / MANGA_PAGES_PER_HOUR : 0;

          break;
        }

        case 'movies': {
          movieStats.total++;
          if (isInProgress) movieStats.in_progress++;
          if (isCompleted) {
            movieStats.completed++;
            movieStats.hours += (media.runtime ?? 120) / 60;
          }
          if (isDropped) movieStats.dropped++;
          break;
        }
        case 'tv': {
          tvStats.total++;
          if (isInProgress) tvStats.in_progress++;
          if (isCompleted) tvStats.completed++;
          if (isDropped) tvStats.dropped++;
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
          if (isCompleted) bookStats.completed++;
          if (isDropped) bookStats.dropped++;

          const pagesRead = isCompleted ? (media.page_count ?? 0) : (entry.progress ?? 0);

          bookStats.pages += pagesRead;

          const BOOK_PAGES_PER_HOUR = 35;
          bookStats.hours += pagesRead > 0 ? pagesRead / BOOK_PAGES_PER_HOUR : 0;

          break;
        }

        default:
          break;
      }
    }

    const activeCategories: string[] = [];
    if (gameStats.total > 0) activeCategories.push('games');
    if (animeStats.total > 0) activeCategories.push('anime');
    if (mangaStats.total > 0) activeCategories.push('manga');
    if (movieStats.total > 0) activeCategories.push('movies');
    if (tvStats.total > 0) activeCategories.push('tv');
    if (bookStats.total > 0) activeCategories.push('books');

    const totalBacklog =
      gameStats.total +
      animeStats.total +
      mangaStats.total +
      movieStats.total +
      tvStats.total +
      bookStats.total;
    const totalInProgress =
      gameStats.in_progress +
      animeStats.in_progress +
      mangaStats.in_progress +
      movieStats.in_progress +
      tvStats.in_progress +
      bookStats.in_progress;
    const totalCompleted =
      gameStats.completed +
      animeStats.completed +
      mangaStats.completed +
      movieStats.completed +
      tvStats.completed +
      bookStats.completed;
    const totalHours =
      gameStats.hours +
      animeStats.hours +
      mangaStats.hours +
      movieStats.hours +
      tvStats.hours +
      bookStats.hours;

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
        hours: Math.round(mangaStats.hours),
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
