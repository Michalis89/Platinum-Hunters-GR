-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 37: Create User Settings Table with RLS
-- =====================================================

CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('system', 'dark', 'light')),
  social_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  community_activity_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  community_suggestions_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  articles_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  reviews_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (
    social_enabled OR (
      community_activity_enabled = FALSE AND community_suggestions_enabled = FALSE
    )
  )
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trigger_update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- End of user_settings migration
-- =====================================================
