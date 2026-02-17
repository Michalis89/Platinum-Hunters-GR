-- =====================================================
-- Migration 52: Drop User Stats and Categories Columns
-- =====================================================
-- GOAL: Remove statistics and categories columns from users table
--
-- AFFECTED COLUMNS:
--   - total_games_completed (gaming statistics)
--   - total_hours_played (gaming statistics)
--   - total_platinums (gaming statistics)
--   - categories (hobby categories - now managed via selections)
--
-- NOTES:
--   - These stats can be calculated from user_media_entries
--   - Categories are managed via UI selections, not stored
-- =====================================================

BEGIN;

-- =====================================================
-- Drop statistics columns
-- =====================================================
ALTER TABLE public.users DROP COLUMN IF EXISTS total_games_completed;
ALTER TABLE public.users DROP COLUMN IF EXISTS total_hours_played;
ALTER TABLE public.users DROP COLUMN IF EXISTS total_platinums;

-- =====================================================
-- Drop categories column
-- =====================================================
ALTER TABLE public.users DROP COLUMN IF EXISTS categories;

COMMIT;

-- =====================================================
-- Verification query (run after migration):
-- =====================================================
-- Check that columns are dropped:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'users'
--   AND table_schema = 'public'
--   AND column_name IN ('total_games_completed', 'total_hours_played', 'total_platinums', 'categories');
-- Should return 0 rows
