-- =====================================================
-- PLATINUM HUNTERS GR - MEDIA ENTRY PRIORITY
-- =====================================================

ALTER TABLE user_media_entries
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS user_media_entries_priority_idx
  ON user_media_entries (user_id, priority DESC);
