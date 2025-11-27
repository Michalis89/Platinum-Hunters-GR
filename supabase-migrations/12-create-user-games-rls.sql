-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 12: RLS Policies for user_games table
-- Ticket: PH-31 - User Games Library System
-- =====================================================

-- Enable RLS
ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;

-- Users can view their own games
CREATE POLICY "Users can view own games"
  ON user_games FOR SELECT
  USING (user_id = auth.uid());

-- Users can add games to their library
CREATE POLICY "Users can add games"
  ON user_games FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own games
CREATE POLICY "Users can update own games"
  ON user_games FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own games
CREATE POLICY "Users can delete own games"
  ON user_games FOR DELETE
  USING (user_id = auth.uid());

-- Admins can view all user games (for stats/moderation)
CREATE POLICY "Admins can view all games"
  ON user_games FOR SELECT
  USING (is_admin());

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies created for user_games table!';
END $$;
