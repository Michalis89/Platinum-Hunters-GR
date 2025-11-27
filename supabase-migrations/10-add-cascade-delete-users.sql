-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 10: Add CASCADE DELETE to users foreign keys
-- Ticket: PH-30 - User Authentication System
-- =====================================================

-- This allows hard delete of users without foreign key constraint errors

-- Drop and recreate foreign keys with ON DELETE CASCADE for guides table
-- (Changes author_id from SET NULL to CASCADE)
ALTER TABLE guides
  DROP CONSTRAINT IF EXISTS guides_author_id_fkey,
  ADD CONSTRAINT guides_author_id_fkey
    FOREIGN KEY (author_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

-- NOTE: The following tables already have ON DELETE CASCADE:
-- ✅ user_backlog.user_id
-- ✅ user_completed_games.user_id
-- ✅ comments.user_id
-- ✅ user_guide_likes.user_id

-- NOTE: The following tables have ON DELETE SET NULL (intentionally kept):
-- ✅ games.created_by (we don't want to delete games when user is deleted)
-- ✅ admin_logs.admin_id (we want to keep logs even if admin is deleted)

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ CASCADE DELETE added to user foreign keys!';
END $$;
