-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 54: Add new feature flags (Social Profile, Diary, D&D)
-- =====================================================

-- Add new feature flag columns
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS social_profile_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS diary_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dnd_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dnd_role TEXT DEFAULT NULL CHECK (dnd_role IN (NULL, 'dm', 'player'));

-- Update existing CHECK constraint to require social_enabled for social_profile_enabled
ALTER TABLE user_settings
  DROP CONSTRAINT IF EXISTS user_settings_check;

ALTER TABLE user_settings
  ADD CONSTRAINT user_settings_check
  CHECK (
    -- Original constraint: social_enabled required for community features
    (social_enabled OR (
      community_activity_enabled = FALSE AND
      community_suggestions_enabled = FALSE
    ))
    AND
    -- New constraint: social_enabled required for social_profile_enabled
    (social_enabled OR social_profile_enabled = FALSE)
    AND
    -- New constraint: dnd_enabled required for dnd_role to be set
    (dnd_enabled OR dnd_role IS NULL)
  );

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ New feature flags added: social_profile_enabled, diary_enabled, dnd_enabled, dnd_role';
END $$;
