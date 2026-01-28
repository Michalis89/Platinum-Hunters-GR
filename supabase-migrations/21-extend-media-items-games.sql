-- =====================================================
-- PLATINUM HUNTERS GR - MEDIA ITEMS (GAMES SUPPORT)
-- =====================================================

ALTER TABLE media_items
  DROP CONSTRAINT IF EXISTS media_items_category_check;

ALTER TABLE media_items
  ADD CONSTRAINT media_items_category_check
  CHECK (category IN ('anime', 'manga', 'movies', 'tv', 'books', 'games'));

ALTER TABLE media_items
  ADD COLUMN IF NOT EXISTS rawg_id INTEGER,
  ADD COLUMN IF NOT EXISTS platforms TEXT[],
  ADD COLUMN IF NOT EXISTS developer TEXT,
  ADD COLUMN IF NOT EXISTS publisher TEXT,
  ADD COLUMN IF NOT EXISTS metacritic INTEGER,
  ADD COLUMN IF NOT EXISTS esrb_rating TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS media_items_rawg_category_uq
  ON media_items (rawg_id, category)
  WHERE rawg_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS media_items_rawg_id_idx ON media_items (rawg_id);
CREATE INDEX IF NOT EXISTS media_items_metacritic_idx ON media_items (metacritic);

DO $$
BEGIN
  RAISE NOTICE '✅ Media items extended for RAWG games support!';
END $$;
