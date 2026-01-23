-- =====================================================
-- PLATINUM HUNTERS GR - MEDIA FAVORITES
-- =====================================================

ALTER TABLE user_media_entries
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS user_media_entries_favorite_idx
  ON user_media_entries (user_id, is_favorite);
