-- =====================================================
-- PLATINUM HUNTERS GR - MEDIA ITEMS (TMDB SUPPORT)
-- =====================================================

-- Allow MAL ID to be optional for non-anime items
ALTER TABLE media_items
  ALTER COLUMN mal_id DROP NOT NULL;

-- Extend category to include movies and tv
ALTER TABLE media_items
  DROP CONSTRAINT IF EXISTS media_items_category_check;

ALTER TABLE media_items
  ADD CONSTRAINT media_items_category_check
  CHECK (category IN ('anime', 'manga', 'movies', 'tv'));

-- TMDB fields
ALTER TABLE media_items
  ADD COLUMN IF NOT EXISTS tmdb_id INTEGER,
  ADD COLUMN IF NOT EXISTS imdb_id TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS original_title TEXT,
  ADD COLUMN IF NOT EXISTS release_date DATE,
  ADD COLUMN IF NOT EXISTS runtime INTEGER,
  ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1),
  ADD COLUMN IF NOT EXISTS vote_count INTEGER,
  ADD COLUMN IF NOT EXISTS popularity DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS first_air_date DATE,
  ADD COLUMN IF NOT EXISTS last_air_date DATE,
  ADD COLUMN IF NOT EXISTS number_of_seasons INTEGER,
  ADD COLUMN IF NOT EXISTS number_of_episodes INTEGER;

-- Indexes for TMDB lookups
CREATE UNIQUE INDEX IF NOT EXISTS media_items_tmdb_category_uq
  ON media_items (tmdb_id, category)
  WHERE tmdb_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS media_items_title_idx ON media_items (title);
CREATE INDEX IF NOT EXISTS media_items_original_title_idx ON media_items (original_title);

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Media items extended for TMDB support!';
END $$;
