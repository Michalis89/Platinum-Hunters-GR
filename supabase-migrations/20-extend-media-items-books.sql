-- =====================================================
-- PLATINUM HUNTERS GR - MEDIA ITEMS (BOOKS SUPPORT)
-- =====================================================

ALTER TABLE media_items
  DROP CONSTRAINT IF EXISTS media_items_category_check;

ALTER TABLE media_items
  ADD CONSTRAINT media_items_category_check
  CHECK (category IN ('anime', 'manga', 'movies', 'tv', 'books'));

ALTER TABLE media_items
  ADD COLUMN IF NOT EXISTS google_books_id TEXT,
  ADD COLUMN IF NOT EXISTS page_count INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS media_items_google_books_category_uq
  ON media_items (google_books_id, category)
  WHERE google_books_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS media_items_page_count_idx ON media_items (page_count);

DO $$
BEGIN
  RAISE NOTICE '✅ Media items extended for Google Books support!';
END $$;
