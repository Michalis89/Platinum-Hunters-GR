-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 5: Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE trophies ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_step_trophies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_backlog ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_completed_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_guide_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Check if user is admin or moderator
CREATE OR REPLACE FUNCTION is_admin_or_moderator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Anyone can read public user info
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Only admins can delete users
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (is_admin());

-- =====================================================
-- GAMES TABLE POLICIES
-- =====================================================

-- Anyone can read games
CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT
  USING (true);

-- Only admins can insert games
CREATE POLICY "Admins can insert games"
  ON games FOR INSERT
  WITH CHECK (is_admin_or_moderator());

-- Only admins can update games
CREATE POLICY "Admins can update games"
  ON games FOR UPDATE
  USING (is_admin_or_moderator());

-- Only admins can delete games
CREATE POLICY "Admins can delete games"
  ON games FOR DELETE
  USING (is_admin());

-- =====================================================
-- REFERENCE TABLES POLICIES (platforms, genres, etc)
-- =====================================================

-- Anyone can read
CREATE POLICY "Platforms are viewable by everyone" ON platforms FOR SELECT USING (true);
CREATE POLICY "Genres are viewable by everyone" ON genres FOR SELECT USING (true);
CREATE POLICY "Developers are viewable by everyone" ON developers FOR SELECT USING (true);
CREATE POLICY "Publishers are viewable by everyone" ON publishers FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage platforms" ON platforms FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage genres" ON genres FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage developers" ON developers FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage publishers" ON publishers FOR ALL USING (is_admin());

-- =====================================================
-- GAME RELATIONSHIPS POLICIES
-- =====================================================

-- Anyone can read
CREATE POLICY "Game platforms are viewable by everyone" ON game_platforms FOR SELECT USING (true);
CREATE POLICY "Game genres are viewable by everyone" ON game_genres FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage game platforms" ON game_platforms FOR ALL USING (is_admin_or_moderator());
CREATE POLICY "Admins can manage game genres" ON game_genres FOR ALL USING (is_admin_or_moderator());

-- =====================================================
-- TROPHIES POLICIES
-- =====================================================

-- Anyone can read trophies
CREATE POLICY "Trophies are viewable by everyone"
  ON trophies FOR SELECT
  USING (true);

-- Only admins can manage trophies
CREATE POLICY "Admins can manage trophies"
  ON trophies FOR ALL
  USING (is_admin_or_moderator());

-- =====================================================
-- GUIDES POLICIES
-- =====================================================

-- Anyone can read published guides
CREATE POLICY "Published guides are viewable by everyone"
  ON guides FOR SELECT
  USING (status = 'published' OR author_id = auth.uid() OR is_admin_or_moderator());

-- Authenticated users can create guides (in draft)
CREATE POLICY "Users can create guides"
  ON guides FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

-- Authors can update their own guides
CREATE POLICY "Authors can update own guides"
  ON guides FOR UPDATE
  USING (author_id = auth.uid() OR is_admin_or_moderator());

-- Admins can delete any guide, authors can delete their own
CREATE POLICY "Authors and admins can delete guides"
  ON guides FOR DELETE
  USING (author_id = auth.uid() OR is_admin());

-- =====================================================
-- GUIDE STEPS POLICIES
-- =====================================================

-- Anyone can read steps of published guides
CREATE POLICY "Guide steps are viewable if guide is viewable"
  ON guide_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guides
      WHERE guides.id = guide_steps.guide_id
      AND (guides.status = 'published' OR guides.author_id = auth.uid() OR is_admin_or_moderator())
    )
  );

-- Authors can manage their guide steps
CREATE POLICY "Authors can manage their guide steps"
  ON guide_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM guides
      WHERE guides.id = guide_steps.guide_id
      AND (guides.author_id = auth.uid() OR is_admin_or_moderator())
    )
  );

-- =====================================================
-- GUIDE STEP TROPHIES POLICIES
-- =====================================================

CREATE POLICY "Guide step trophies are viewable by everyone"
  ON guide_step_trophies FOR SELECT
  USING (true);

CREATE POLICY "Authors can manage guide step trophies"
  ON guide_step_trophies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM guide_steps gs
      JOIN guides gu ON gs.guide_id = gu.id
      WHERE gs.id = guide_step_trophies.step_id
      AND (gu.author_id = auth.uid() OR is_admin_or_moderator())
    )
  );

-- =====================================================
-- USER BACKLOG POLICIES
-- =====================================================

-- Users can only read their own backlog
CREATE POLICY "Users can view own backlog"
  ON user_backlog FOR SELECT
  USING (user_id = auth.uid());

-- Users can add to their own backlog
CREATE POLICY "Users can add to own backlog"
  ON user_backlog FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own backlog
CREATE POLICY "Users can update own backlog"
  ON user_backlog FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete from their own backlog
CREATE POLICY "Users can delete from own backlog"
  ON user_backlog FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- USER COMPLETED GAMES POLICIES
-- =====================================================

-- Users can view their own completed games, others can view if public
-- For now, make all completed games public (you can add a privacy setting later)
CREATE POLICY "Completed games are viewable"
  ON user_completed_games FOR SELECT
  USING (true);

-- Users can add their own completed games
CREATE POLICY "Users can add own completed games"
  ON user_completed_games FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own completed games
CREATE POLICY "Users can update own completed games"
  ON user_completed_games FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own completed games
CREATE POLICY "Users can delete own completed games"
  ON user_completed_games FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- COMMENTS POLICIES
-- =====================================================

-- Anyone can read approved comments
CREATE POLICY "Approved comments are viewable by everyone"
  ON comments FOR SELECT
  USING (is_approved = true AND is_deleted = false);

-- Authenticated users can create comments
CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid() OR is_admin_or_moderator());

-- Users can delete their own comments, admins can delete any
CREATE POLICY "Users and admins can delete comments"
  ON comments FOR DELETE
  USING (user_id = auth.uid() OR is_admin_or_moderator());

-- =====================================================
-- USER GUIDE LIKES POLICIES
-- =====================================================

-- Anyone can see likes count (aggregated)
CREATE POLICY "Guide likes are viewable by everyone"
  ON user_guide_likes FOR SELECT
  USING (true);

-- Users can like guides
CREATE POLICY "Users can like guides"
  ON user_guide_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can unlike guides
CREATE POLICY "Users can unlike guides"
  ON user_guide_likes FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- ADMIN LOGS POLICIES
-- =====================================================

-- Only admins can read admin logs
CREATE POLICY "Admins can view admin logs"
  ON admin_logs FOR SELECT
  USING (is_admin());

-- Only admins can create admin logs
CREATE POLICY "Admins can create admin logs"
  ON admin_logs FOR INSERT
  WITH CHECK (is_admin());

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All RLS policies created successfully!';
END $$;
