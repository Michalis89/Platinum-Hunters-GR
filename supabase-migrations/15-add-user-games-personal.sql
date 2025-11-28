-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 15: Add personal difficulty & favorite to user_games
-- =====================================================

ALTER TABLE user_games
  ADD COLUMN IF NOT EXISTS personal_difficulty INTEGER CHECK (personal_difficulty BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Optional: enforce rating bounds if not already constrained
ALTER TABLE user_games
  ADD CONSTRAINT IF NOT EXISTS chk_user_games_personal_rating_range
  CHECK (personal_rating IS NULL OR (personal_rating >= 1 AND personal_rating <= 10));

-- Success notice
DO $$
BEGIN
  RAISE NOTICE '✅ Added personal_difficulty and is_favorite to user_games';
END $$;
