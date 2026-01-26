-- =====================================================
-- PLATINUM HUNTERS GR - USER MEDIA STATUS (DROPPED)
-- =====================================================

ALTER TABLE user_media_entries
  DROP CONSTRAINT IF EXISTS user_media_entries_status_check;

ALTER TABLE user_media_entries
  ADD CONSTRAINT user_media_entries_status_check
  CHECK (status IN ('planned', 'current', 'completed', 'dropped'));

DO $$
BEGIN
  RAISE NOTICE '✅ user_media_entries status updated with dropped!';
END $$;
