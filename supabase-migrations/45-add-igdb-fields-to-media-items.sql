ALTER TABLE public.media_items
  ADD COLUMN IF NOT EXISTS igdb_id BIGINT,
  ADD COLUMN IF NOT EXISTS igdb_slug TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS storyline TEXT,
  ADD COLUMN IF NOT EXISTS first_release_date DATE,
  ADD COLUMN IF NOT EXISTS cover_image_id TEXT,
  ADD COLUMN IF NOT EXISTS cover_url_thumb TEXT,
  ADD COLUMN IF NOT EXISTS cover_url_big TEXT,
  ADD COLUMN IF NOT EXISTS aggregated_rating NUMERIC,
  ADD COLUMN IF NOT EXISTS aggregated_rating_count INT,
  ADD COLUMN IF NOT EXISTS rating_count INT,
  ADD COLUMN IF NOT EXISTS websites JSONB,
  ADD COLUMN IF NOT EXISTS igdb_updated_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS media_items_igdb_category_uq
  ON public.media_items (igdb_id, category)
  WHERE igdb_id IS NOT NULL AND category = 'games';

CREATE INDEX IF NOT EXISTS media_items_igdb_id_idx
  ON public.media_items (igdb_id)
  WHERE igdb_id IS NOT NULL;
