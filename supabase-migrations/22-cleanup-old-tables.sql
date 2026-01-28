-- =====================================================
-- PLATINUM HUNTERS GR - CLEANUP OLD TABLES
-- Remove legacy game/guide tables, keep media_items system
-- =====================================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS full_game_data CASCADE;
DROP VIEW IF EXISTS guides_with_game CASCADE;
DROP VIEW IF EXISTS popular_games CASCADE;
DROP VIEW IF EXISTS trending_platinums CASCADE;
DROP VIEW IF EXISTS user_backlog_with_game CASCADE;
DROP VIEW IF EXISTS user_completed_with_game CASCADE;

-- Drop tables with foreign key dependencies first
DROP TABLE IF EXISTS user_guide_likes CASCADE;
DROP TABLE IF EXISTS guide_step_trophies CASCADE;
DROP TABLE IF EXISTS guide_steps CASCADE;
DROP TABLE IF EXISTS user_backlog CASCADE;
DROP TABLE IF EXISTS user_completed_games CASCADE;
DROP TABLE IF EXISTS user_games CASCADE;
DROP TABLE IF EXISTS trophies CASCADE;
DROP TABLE IF EXISTS guides CASCADE;
DROP TABLE IF EXISTS game_genres CASCADE;
DROP TABLE IF EXISTS game_platforms CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS genres CASCADE;
DROP TABLE IF EXISTS platforms CASCADE;
DROP TABLE IF EXISTS developers CASCADE;
DROP TABLE IF EXISTS publishers CASCADE;
DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS comments CASCADE;

-- Drop related functions
DROP FUNCTION IF EXISTS fuzzy_search(text) CASCADE;

-- Clean up any orphaned indexes (if they exist)
DROP INDEX IF EXISTS games_slug_idx;
DROP INDEX IF EXISTS games_rawg_id_idx;
DROP INDEX IF EXISTS games_title_trgm_idx;
DROP INDEX IF EXISTS games_search_idx;
DROP INDEX IF EXISTS guides_game_id_idx;
DROP INDEX IF EXISTS guides_author_id_idx;
DROP INDEX IF EXISTS trophies_game_id_idx;
DROP INDEX IF EXISTS user_backlog_user_id_idx;
DROP INDEX IF EXISTS user_backlog_game_id_idx;
DROP INDEX IF EXISTS user_completed_games_user_id_idx;
DROP INDEX IF EXISTS user_completed_games_game_id_idx;
DROP INDEX IF EXISTS user_games_user_id_idx;
DROP INDEX IF EXISTS user_games_game_id_idx;

DO $$
BEGIN
  RAISE NOTICE '✅ Old game/guide tables cleaned up successfully!';
  RAISE NOTICE '📦 Keeping: users, media_items, user_media_entries, articles, activity_log, submissions';
END $$;
