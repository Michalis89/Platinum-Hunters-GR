-- =====================================================
-- USER STATS RPC (DB-LEVEL AGGREGATION)
-- =====================================================

CREATE INDEX IF NOT EXISTS user_media_entries_user_status_media_idx
  ON public.user_media_entries (user_id, status, media_id);

CREATE OR REPLACE FUNCTION public.calculate_user_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE SQL
STABLE
AS $$
  WITH per_entry AS (
    SELECT
      LOWER(COALESCE(mi.category, '')) AS category,
      ume.status,
      COALESCE(ume.progress, 0)::numeric AS progress,
      COALESCE(mi.runtime, 0)::numeric AS runtime,
      COALESCE(mi.duration, 0)::numeric AS duration,
      COALESCE(mi.number_of_episodes, mi.episodes, 0)::numeric AS total_episodes,
      COALESCE(mi.page_count, 0)::numeric AS page_count,
      COALESCE(mi.volumes, 0)::numeric AS volumes
    FROM public.user_media_entries AS ume
    JOIN public.media_items AS mi ON mi.id = ume.media_id
    WHERE ume.user_id = p_user_id
  ),
  category_agg AS (
    SELECT
      category,
      COUNT(*)::integer AS total,
      COUNT(*) FILTER (
        WHERE (category = 'movies' AND status = 'planned')
           OR (category <> 'movies' AND status = 'current')
      )::integer AS in_progress,
      COUNT(*) FILTER (WHERE status = 'completed')::integer AS completed,
      COUNT(*) FILTER (WHERE status = 'dropped')::integer AS dropped,
      SUM(
        CASE
          WHEN category = 'games' THEN progress
          ELSE 0
        END
      ) AS games_hours,
      SUM(
        CASE
          WHEN category = 'anime' AND status = 'completed'
            THEN (total_episodes * COALESCE(NULLIF(duration, 0), 24)) / 60
          WHEN category = 'anime' AND status = 'current' AND progress > 0
            THEN (progress * COALESCE(NULLIF(duration, 0), 24)) / 60
          ELSE 0
        END
      ) AS anime_hours,
      SUM(
        CASE
          WHEN category = 'manga' AND status = 'completed'
            THEN (volumes * 220) / 55
          WHEN category = 'manga'
            THEN (progress * 220) / 55
          ELSE 0
        END
      ) AS manga_hours,
      SUM(
        CASE
          WHEN category = 'manga' AND status = 'completed' THEN volumes
          WHEN category = 'manga' THEN progress
          ELSE 0
        END
      )::integer AS manga_chapters,
      SUM(
        CASE
          WHEN category = 'movies' AND status = 'completed'
            THEN COALESCE(NULLIF(runtime, 0), 120) / 60
          ELSE 0
        END
      ) AS movie_hours,
      SUM(
        CASE
          WHEN category = 'tv' AND status = 'completed'
            THEN (total_episodes * COALESCE(NULLIF(runtime, 0), 45)) / 60
          WHEN category = 'tv' AND status = 'current' AND progress > 0
            THEN (progress * COALESCE(NULLIF(runtime, 0), 45)) / 60
          ELSE 0
        END
      ) AS tv_hours,
      SUM(
        CASE
          WHEN category = 'books' AND status = 'completed'
            THEN page_count / 35
          WHEN category = 'books'
            THEN progress / 35
          ELSE 0
        END
      ) AS book_hours,
      SUM(
        CASE
          WHEN category = 'books' AND status = 'completed' THEN page_count
          WHEN category = 'books' THEN progress
          ELSE 0
        END
      )::integer AS book_pages
    FROM per_entry
    GROUP BY category
  ),
  games AS (
    SELECT
      COALESCE(total, 0) AS total,
      COALESCE(in_progress, 0) AS in_progress,
      COALESCE(completed, 0) AS completed,
      COALESCE(dropped, 0) AS dropped,
      ROUND(COALESCE(games_hours, 0))::integer AS hours
    FROM category_agg
    WHERE category = 'games'
  ),
  anime AS (
    SELECT
      COALESCE(total, 0) AS total,
      COALESCE(in_progress, 0) AS in_progress,
      COALESCE(completed, 0) AS completed,
      COALESCE(dropped, 0) AS dropped,
      ROUND(COALESCE(anime_hours, 0))::integer AS hours
    FROM category_agg
    WHERE category = 'anime'
  ),
  manga AS (
    SELECT
      COALESCE(total, 0) AS total,
      COALESCE(in_progress, 0) AS in_progress,
      COALESCE(completed, 0) AS completed,
      COALESCE(dropped, 0) AS dropped,
      ROUND(COALESCE(manga_hours, 0))::integer AS hours,
      COALESCE(manga_chapters, 0) AS chapters
    FROM category_agg
    WHERE category = 'manga'
  ),
  movies AS (
    SELECT
      COALESCE(total, 0) AS total,
      COALESCE(in_progress, 0) AS in_progress,
      COALESCE(completed, 0) AS completed,
      COALESCE(dropped, 0) AS dropped,
      ROUND(COALESCE(movie_hours, 0))::integer AS hours
    FROM category_agg
    WHERE category = 'movies'
  ),
  tv AS (
    SELECT
      COALESCE(total, 0) AS total,
      COALESCE(in_progress, 0) AS in_progress,
      COALESCE(completed, 0) AS completed,
      COALESCE(dropped, 0) AS dropped,
      ROUND(COALESCE(tv_hours, 0))::integer AS hours
    FROM category_agg
    WHERE category = 'tv'
  ),
  books AS (
    SELECT
      COALESCE(total, 0) AS total,
      COALESCE(in_progress, 0) AS in_progress,
      COALESCE(completed, 0) AS completed,
      COALESCE(dropped, 0) AS dropped,
      ROUND(COALESCE(book_hours, 0))::integer AS hours,
      COALESCE(book_pages, 0) AS pages
    FROM category_agg
    WHERE category = 'books'
  ),
  overall AS (
    SELECT ROUND(
      COALESCE(SUM(games_hours), 0) +
      COALESCE(SUM(anime_hours), 0) +
      COALESCE(SUM(manga_hours), 0) +
      COALESCE(SUM(movie_hours), 0) +
      COALESCE(SUM(tv_hours), 0) +
      COALESCE(SUM(book_hours), 0)
    )::integer AS total_hours
    FROM category_agg
  )
  SELECT jsonb_build_object(
    'total_backlog',
      COALESCE((SELECT total FROM games), 0) +
      COALESCE((SELECT total FROM anime), 0) +
      COALESCE((SELECT total FROM manga), 0) +
      COALESCE((SELECT total FROM movies), 0) +
      COALESCE((SELECT total FROM tv), 0) +
      COALESCE((SELECT total FROM books), 0),
    'in_progress',
      COALESCE((SELECT in_progress FROM games), 0) +
      COALESCE((SELECT in_progress FROM anime), 0) +
      COALESCE((SELECT in_progress FROM manga), 0) +
      COALESCE((SELECT in_progress FROM movies), 0) +
      COALESCE((SELECT in_progress FROM tv), 0) +
      COALESCE((SELECT in_progress FROM books), 0),
    'completed',
      COALESCE((SELECT completed FROM games), 0) +
      COALESCE((SELECT completed FROM anime), 0) +
      COALESCE((SELECT completed FROM manga), 0) +
      COALESCE((SELECT completed FROM movies), 0) +
      COALESCE((SELECT completed FROM tv), 0) +
      COALESCE((SELECT completed FROM books), 0),
    'total_hours', COALESCE((SELECT total_hours FROM overall), 0),
    'games', COALESCE((SELECT to_jsonb(games) FROM games), '{"total":0,"in_progress":0,"completed":0,"dropped":0,"hours":0}'::jsonb),
    'anime', COALESCE((SELECT to_jsonb(anime) FROM anime), '{"total":0,"in_progress":0,"completed":0,"dropped":0,"hours":0}'::jsonb),
    'manga', COALESCE((SELECT to_jsonb(manga) FROM manga), '{"total":0,"in_progress":0,"completed":0,"dropped":0,"hours":0,"chapters":0}'::jsonb),
    'movies', COALESCE((SELECT to_jsonb(movies) FROM movies), '{"total":0,"in_progress":0,"completed":0,"dropped":0,"hours":0}'::jsonb),
    'tv', COALESCE((SELECT to_jsonb(tv) FROM tv), '{"total":0,"in_progress":0,"completed":0,"dropped":0,"hours":0}'::jsonb),
    'books', COALESCE((SELECT to_jsonb(books) FROM books), '{"total":0,"in_progress":0,"completed":0,"dropped":0,"hours":0,"pages":0}'::jsonb),
    'active_categories',
      COALESCE(
        (
          SELECT jsonb_agg(cat.category ORDER BY cat.sort_order)
          FROM (
            SELECT 'games'::text AS category, 1 AS sort_order, COALESCE((SELECT total FROM games), 0) AS total
            UNION ALL SELECT 'anime', 2, COALESCE((SELECT total FROM anime), 0)
            UNION ALL SELECT 'manga', 3, COALESCE((SELECT total FROM manga), 0)
            UNION ALL SELECT 'movies', 4, COALESCE((SELECT total FROM movies), 0)
            UNION ALL SELECT 'tv', 5, COALESCE((SELECT total FROM tv), 0)
            UNION ALL SELECT 'books', 6, COALESCE((SELECT total FROM books), 0)
          ) AS cat
          WHERE cat.total > 0
        ),
        '[]'::jsonb
      )
  );
$$;

COMMENT ON FUNCTION public.calculate_user_stats IS 'Returns user personal stats as JSONB using DB-level aggregation.';
