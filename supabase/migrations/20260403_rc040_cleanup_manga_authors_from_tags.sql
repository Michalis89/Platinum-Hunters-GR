-- RC-040: safely clean stale manga.authors values derived from media_items.tags.
-- Context:
-- - Older server-side recompute logic populated `profiles.manga.authors` using manga `tags`.
-- - For MAL manga/anime records, `tags` often contain alternate titles/synonyms, not creator names.
--
-- Safety rule:
-- - Only remove `profiles.manga.authors` when its normalized value set exactly matches
--   the currently derivable top manga-tag set (same user, same scoring model).
-- - This avoids touching clearly manual/custom author values.

WITH manga_weighted_tags AS (
  SELECT
    ume.user_id,
    regexp_replace(trim(tag_name), '\s+', ' ', 'g') AS name,
    (
      1
      + CASE WHEN COALESCE(ume.is_favorite, false) THEN 6 ELSE 0 END
      + CASE
          WHEN ume.score IS NULL THEN 0
          WHEN ume.score >= 10 THEN 5
          WHEN ume.score >= 9 THEN 4
          WHEN ume.score >= 8 THEN 3
          WHEN ume.score >= 7 THEN 2
          ELSE 0
        END
    )::numeric AS points
  FROM public.user_media_entries ume
  JOIN public.media_items mi
    ON mi.id = ume.media_id
  CROSS JOIN LATERAL (
    SELECT value AS tag_name
    FROM jsonb_array_elements_text(
      CASE
        WHEN jsonb_typeof(mi.tags::jsonb) = 'array' THEN mi.tags::jsonb
        ELSE '[]'::jsonb
      END
    )

    UNION ALL

    SELECT value AS tag_name
    FROM regexp_split_to_table(
      CASE
        WHEN jsonb_typeof(mi.tags::jsonb) = 'string' THEN trim(both '"' from mi.tags::text)
        ELSE ''
      END,
      ','
    ) AS value
  ) tags_src
  WHERE mi.category = 'manga'
    AND ume.status = 'completed'
    AND trim(tag_name) <> ''
),
tag_scores AS (
  SELECT
    user_id,
    name,
    SUM(points) AS score
  FROM manga_weighted_tags
  GROUP BY user_id, name
),
top_tag_names AS (
  SELECT
    user_id,
    name,
    score,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY score DESC, name ASC) AS rn
  FROM tag_scores
),
derived_name_sets AS (
  SELECT
    user_id,
    ARRAY_AGG(name ORDER BY name ASC) AS derived_names_sorted
  FROM top_tag_names
  WHERE rn <= 3
  GROUP BY user_id
),
current_name_sets AS (
  SELECT
    ucp.user_id,
    ARRAY_AGG(DISTINCT regexp_replace(trim(part), '\s+', ' ', 'g') ORDER BY regexp_replace(trim(part), '\s+', ' ', 'g')) AS current_names_sorted
  FROM public.user_category_profiles ucp
  CROSS JOIN LATERAL regexp_split_to_table(
    COALESCE(ucp.profiles::jsonb -> 'manga' ->> 'authors', ''),
    '\s*,\s*'
  ) AS part
  WHERE trim(part) <> ''
  GROUP BY ucp.user_id
),
rows_to_cleanup AS (
  SELECT ucp.user_id
  FROM public.user_category_profiles ucp
  JOIN derived_name_sets d
    ON d.user_id = ucp.user_id
  JOIN current_name_sets c
    ON c.user_id = ucp.user_id
  WHERE jsonb_typeof(ucp.profiles::jsonb -> 'manga') = 'object'
    AND jsonb_typeof(ucp.profiles::jsonb -> 'manga' -> 'authors') = 'string'
    AND c.current_names_sorted = d.derived_names_sorted
)
UPDATE public.user_category_profiles ucp
SET
  profiles = jsonb_set(
    ucp.profiles::jsonb,
    '{manga}',
    (ucp.profiles::jsonb -> 'manga') - 'authors',
    true
  ),
  updated_at = now()
FROM rows_to_cleanup r
WHERE ucp.user_id = r.user_id;
