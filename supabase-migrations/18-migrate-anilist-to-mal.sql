-- =====================================================
-- PLATINUM HUNTERS GR - MIGRATE ANILIST -> MAL
-- =====================================================

ALTER TABLE media_items
  RENAME COLUMN anilist_id TO mal_id;

ALTER TABLE media_items
  ALTER COLUMN source SET DEFAULT 'mal';

UPDATE media_items
  SET source = 'mal'
  WHERE source = 'anilist';

ALTER TABLE media_items
  DROP CONSTRAINT IF EXISTS media_items_anilist_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS media_items_mal_category_uq
  ON media_items (mal_id, category);
