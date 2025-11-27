-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 7: Add User Authentication & Profile Fields
-- Ticket: PH-30 - User Authentication System
-- =====================================================

-- Add Personal Info fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'el';

-- Add Gaming Info fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS psn_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS xbox_gamertag TEXT,
  ADD COLUMN IF NOT EXISTS steam_id TEXT,
  ADD COLUMN IF NOT EXISTS nintendo_id TEXT,
  ADD COLUMN IF NOT EXISTS favorite_platform TEXT,
  ADD COLUMN IF NOT EXISTS favorite_genres TEXT[],
  ADD COLUMN IF NOT EXISTS gaming_since INTEGER;

-- Add Privacy Settings (JSONB for flexibility)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"profile_visibility": "public", "show_email": false, "show_stats": true, "show_psn_id": true}'::jsonb;

-- Add Notification Preferences (JSONB)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"newsletter": true, "guide_updates": true, "comments": true, "replies": true, "weekly_digest": false}'::jsonb;

-- Add Social Links (JSONB)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Add System/Metadata fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned'));

-- Update role constraint to include 'author'
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check,
  ADD CONSTRAINT users_role_check
    CHECK (role IN ('user', 'author', 'moderator', 'admin'));

-- Create index for PSN ID lookups (for trophy sync)
CREATE INDEX IF NOT EXISTS idx_users_psn_id ON users(psn_id) WHERE psn_id IS NOT NULL;

-- Create index for email verification status
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Create index for account status
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ User authentication fields added successfully!';
END $$;
