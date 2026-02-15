CREATE TABLE IF NOT EXISTS public.tag_definitions (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'rawg',
  rawg_tag_id INT,
  games_count INT,
  bucket TEXT NOT NULL CHECK (
    bucket IN ('subgenre', 'mechanic', 'structure', 'mood', 'theme', 'playstyle', 'noise', 'unknown')
  ),
  is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.media_item_tag_links (
  media_item_id BIGINT NOT NULL REFERENCES public.media_items(id) ON DELETE CASCADE,
  tag_key TEXT NOT NULL REFERENCES public.tag_definitions(key) ON DELETE CASCADE,
  PRIMARY KEY (media_item_id, tag_key)
);

CREATE INDEX IF NOT EXISTS idx_tag_definitions_bucket ON public.tag_definitions(bucket);
CREATE INDEX IF NOT EXISTS idx_tag_definitions_source ON public.tag_definitions(source);
CREATE INDEX IF NOT EXISTS idx_media_item_tag_links_media ON public.media_item_tag_links(media_item_id);
CREATE INDEX IF NOT EXISTS idx_media_item_tag_links_tag ON public.media_item_tag_links(tag_key);

DROP TRIGGER IF EXISTS trigger_update_tag_definitions_updated_at ON public.tag_definitions;
CREATE TRIGGER trigger_update_tag_definitions_updated_at
  BEFORE UPDATE ON public.tag_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TEMP TABLE tmp_normalized_rawg_tags ON COMMIT DROP AS
WITH rawg_tags AS (
  SELECT
    m.id AS media_item_id,
    LOWER(TRIM(COALESCE(tag ->> 'slug', ''))) AS key,
    COALESCE(
      NULLIF(TRIM(tag ->> 'name'), ''),
      INITCAP(REPLACE(COALESCE(tag ->> 'slug', ''), '-', ' '))
    ) AS name,
    CASE
      WHEN (tag ->> 'id') ~ '^\d+$' THEN (tag ->> 'id')::INT
      ELSE NULL
    END AS rawg_tag_id,
    CASE
      WHEN (tag ->> 'games_count') ~ '^\d+$' THEN (tag ->> 'games_count')::INT
      ELSE NULL
    END AS games_count,
    LOWER(TRIM(COALESCE(tag ->> 'type', ''))) AS legacy_type
  FROM public.media_items m
  CROSS JOIN LATERAL JSONB_ARRAY_ELEMENTS(COALESCE(m.tags, '[]'::JSONB)) AS tag
  WHERE m.category = 'games'
    AND JSONB_TYPEOF(tag) = 'object'
    AND COALESCE(tag ->> 'slug', '') <> ''
),
normalized AS (
  SELECT
    media_item_id,
    key,
    name,
    rawg_tag_id,
    games_count,
    CASE
      WHEN legacy_type = 'noise' THEN 'noise'
      WHEN legacy_type = 'playstyle' THEN 'playstyle'
      WHEN key = 'souls-like' THEN 'subgenre'
      ELSE 'unknown'
    END AS bucket
  FROM rawg_tags
  WHERE key <> ''
)
SELECT * FROM normalized;

INSERT INTO public.tag_definitions (key, name, source, rawg_tag_id, games_count, bucket)
SELECT DISTINCT ON (key)
  key,
  name,
  'rawg',
  rawg_tag_id,
  games_count,
  bucket
FROM tmp_normalized_rawg_tags
ORDER BY key, games_count ASC NULLS LAST
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  rawg_tag_id = EXCLUDED.rawg_tag_id,
  games_count = EXCLUDED.games_count,
  bucket = CASE
    WHEN public.tag_definitions.is_manual_override THEN public.tag_definitions.bucket
    ELSE EXCLUDED.bucket
  END;

INSERT INTO public.media_item_tag_links (media_item_id, tag_key)
SELECT DISTINCT media_item_id, key
FROM tmp_normalized_rawg_tags
ON CONFLICT (media_item_id, tag_key) DO NOTHING;
