ALTER TABLE public.media_items
  ADD COLUMN IF NOT EXISTS igdb_category SMALLINT;

CREATE INDEX IF NOT EXISTS media_items_igdb_category_idx
  ON public.media_items (igdb_category)
  WHERE category = 'games';

-- Cleanup: remove disallowed IGDB-derived game rows.
-- Preference order:
-- 1) Use explicit igdb_category when available.
-- 2) Fallback to title/slug heuristics when igdb_category is missing.
WITH excluded_games AS (
  SELECT id
  FROM public.media_items
  WHERE category = 'games'
    AND igdb_id IS NOT NULL
    AND (
      (igdb_category IS NOT NULL AND igdb_category IN (5,6,7,10,11,12))
      OR (
        igdb_category IS NULL
        AND (
          COALESCE(title, '') || ' ' || COALESCE(title_english, '') || ' ' || COALESCE(igdb_slug, '')
        ) ~* '(compilation|collector|expanded|mod|season pass)'
      )
    )
)
DELETE FROM public.media_items AS m
USING excluded_games AS e
WHERE m.id = e.id;
