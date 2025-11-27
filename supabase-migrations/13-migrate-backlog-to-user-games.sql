-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 13: Migrate data from user_backlog to user_games
-- Ticket: PH-31 - User Games Library System
-- =====================================================

-- Migrate data from user_backlog to user_games
-- All backlog items become 'to_play' status
INSERT INTO user_games (
  user_id,
  game_id,
  status,
  priority,
  notes,
  added_at
)
SELECT
  user_id,
  game_id,
  'to_play' AS status,
  priority,
  notes,
  added_at
FROM user_backlog
ON CONFLICT (user_id, game_id) DO NOTHING;

-- Count migrated records
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM user_games
  WHERE status = 'to_play';

  RAISE NOTICE '✅ Migrated % records from user_backlog to user_games!', migrated_count;
END $$;

-- Optional: Drop old user_backlog table (commented out for safety)
-- Uncomment only after verifying migration was successful
-- DROP TABLE IF EXISTS user_backlog;

-- Optional: Migrate user_completed_games data
-- Uncomment if you want to migrate completed games as well
/*
INSERT INTO user_games (
  user_id,
  game_id,
  status,
  actual_hours_casual,
  completed_at,
  platinumed_at,
  personal_rating,
  would_recommend,
  notes,
  added_at
)
SELECT
  user_id,
  game_id,
  CASE
    WHEN got_platinum = TRUE THEN 'platinumed'
    ELSE 'completed'
  END AS status,
  actual_hours,
  completed_at,
  platinum_date,
  rating,
  would_recommend,
  review_text AS notes,
  created_at AS added_at
FROM user_completed_games
ON CONFLICT (user_id, game_id) DO UPDATE SET
  status = EXCLUDED.status,
  actual_hours_casual = EXCLUDED.actual_hours_casual,
  completed_at = EXCLUDED.completed_at,
  platinumed_at = EXCLUDED.platinumed_at,
  personal_rating = EXCLUDED.personal_rating,
  would_recommend = EXCLUDED.would_recommend,
  notes = EXCLUDED.notes;
*/
