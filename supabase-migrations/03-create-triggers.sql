-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 3: Create Triggers & Functions for Auto-updates
-- =====================================================

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_guides_updated_at
  BEFORE UPDATE ON guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_completed_games_updated_at
  BEFORE UPDATE ON user_completed_games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- UPDATE GAME STATS
-- =====================================================

-- Update game's total_guides count
CREATE OR REPLACE FUNCTION update_game_guide_count()
RETURNS TRIGGER AS $$
DECLARE
  target_game_id INTEGER;
BEGIN
  -- Determine which game to update
  IF TG_OP = 'DELETE' THEN
    target_game_id := OLD.game_id;
  ELSE
    target_game_id := NEW.game_id;
  END IF;

  -- Update the count
  UPDATE games
  SET total_guides = (
    SELECT COUNT(*) FROM guides
    WHERE game_id = target_game_id AND status = 'published'
  )
  WHERE id = target_game_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_game_guide_count
  AFTER INSERT OR UPDATE OR DELETE ON guides
  FOR EACH ROW EXECUTE FUNCTION update_game_guide_count();

-- Update game's average difficulty and hours
CREATE OR REPLACE FUNCTION update_game_averages()
RETURNS TRIGGER AS $$
DECLARE
  target_game_id INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_game_id := OLD.game_id;
  ELSE
    target_game_id := NEW.game_id;
  END IF;

  UPDATE games
  SET
    average_difficulty = (
      SELECT AVG(difficulty_rating)
      FROM guides
      WHERE game_id = target_game_id AND status = 'published' AND difficulty_rating IS NOT NULL
    ),
    average_hours = (
      SELECT AVG(estimated_hours)
      FROM guides
      WHERE game_id = target_game_id AND status = 'published' AND estimated_hours IS NOT NULL
    )
  WHERE id = target_game_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_game_averages
  AFTER INSERT OR UPDATE OR DELETE ON guides
  FOR EACH ROW EXECUTE FUNCTION update_game_averages();

-- =====================================================
-- UPDATE USER STATS
-- =====================================================

-- Update user's cached stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  ELSE
    target_user_id := NEW.user_id;
  END IF;

  UPDATE users
  SET
    total_games_completed = (
      SELECT COUNT(*) FROM user_completed_games
      WHERE user_id = target_user_id
    ),
    total_platinums = (
      SELECT COUNT(*) FROM user_completed_games
      WHERE user_id = target_user_id AND got_platinum = TRUE
    ),
    total_hours_played = (
      SELECT COALESCE(SUM(actual_hours), 0)
      FROM user_completed_games
      WHERE user_id = target_user_id
    )
  WHERE id = target_user_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats
  AFTER INSERT OR UPDATE OR DELETE ON user_completed_games
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- =====================================================
-- UPDATE GUIDE LIKES COUNT
-- =====================================================

-- Update guide's likes count
CREATE OR REPLACE FUNCTION update_guide_likes_count()
RETURNS TRIGGER AS $$
DECLARE
  target_guide_id INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_guide_id := OLD.guide_id;
  ELSE
    target_guide_id := NEW.guide_id;
  END IF;

  UPDATE guides
  SET likes = (
    SELECT COUNT(*) FROM user_guide_likes
    WHERE guide_id = target_guide_id
  )
  WHERE id = target_guide_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_guide_likes_count
  AFTER INSERT OR DELETE ON user_guide_likes
  FOR EACH ROW EXECUTE FUNCTION update_guide_likes_count();

-- =====================================================
-- AUTO-SET PUBLISHED_AT
-- =====================================================

-- Automatically set published_at when guide is published
CREATE OR REPLACE FUNCTION set_guide_published_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changes to 'published' and published_at is not set
  IF NEW.status = 'published' AND OLD.status != 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_guide_published_at
  BEFORE UPDATE ON guides
  FOR EACH ROW EXECUTE FUNCTION set_guide_published_at();

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All triggers and functions created successfully!';
END $$;
