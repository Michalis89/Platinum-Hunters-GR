-- =====================================================
-- Migration: User Profile Data Refactor (Non-Breaking) - FIXED VERSION
-- =====================================================
-- GOAL: Extract location_city and category_notes from social_links
--       into proper database structures while maintaining backward compatibility.
--
-- APPROACH:
--   - Add users.location_city column (nullable)
--   - Create user_category_profiles table
--   - Backfill data from social_links
--   - Copy game fields into profiles.games
--   - DO NOT drop any existing columns
--
-- POST-MIGRATION: API endpoints will read new fields with fallback to old fields
-- FUTURE CLEANUP: Remove old columns in a separate migration after full transition
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Add location_city column to users table
-- =====================================================
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS location_city TEXT;

COMMENT ON COLUMN public.users.location_city IS
  'City name (preferred source, extracted from social_links.location_city)';


-- =====================================================
-- STEP 2: Create user_category_profiles table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_category_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  profiles JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.user_category_profiles IS
  'Per-user category profile metadata (games, anime, manga, movies, tv, books, coding, pet, vape)';
COMMENT ON COLUMN public.user_category_profiles.profiles IS
  'Map keyed by category: { games: {...}, tv: {...}, anime: {...}, ... }';


-- =====================================================
-- STEP 3: Create trigger for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_user_category_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_category_profiles_updated_at ON public.user_category_profiles;

CREATE TRIGGER trigger_user_category_profiles_updated_at
  BEFORE UPDATE ON public.user_category_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_category_profiles_updated_at();


-- =====================================================
-- STEP 4: Enable RLS
-- =====================================================
ALTER TABLE public.user_category_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select their own category profile
CREATE POLICY "Users can select own category profile"
ON public.user_category_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own category profile
CREATE POLICY "Users can insert own category profile"
ON public.user_category_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own category profile
CREATE POLICY "Users can update own category profile"
ON public.user_category_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own category profile (cascade handled by FK)
CREATE POLICY "Users can delete own category profile"
ON public.user_category_profiles
FOR DELETE
USING (auth.uid() = user_id);


-- =====================================================
-- STEP 5: Data Backfill (Idempotent) - FIXED VERSION
-- =====================================================
-- This is a COPY operation, not a MOVE. Old data remains intact.

DO $$
DECLARE
  user_record RECORD;
  social_obj JSONB;
  extracted_location TEXT;
  extracted_category_notes JSONB;
  game_profile JSONB;
BEGIN
  -- Loop through all users
  FOR user_record IN
    SELECT
      id,
      social_links,
      psn_id,
      xbox_gamertag,
      steam_id,
      nintendo_id,
      favorite_platform,
      gaming_since,
      favorite_genres,
      location_city AS current_location_city
    FROM public.users
  LOOP
    -- Parse social_links (handle TEXT column containing JSON string or JSONB)
    BEGIN
      IF user_record.social_links IS NULL THEN
        social_obj := '{}'::jsonb;
      ELSIF pg_typeof(user_record.social_links) = 'text'::regtype THEN
        -- social_links is TEXT containing JSON string (possibly escaped)
        social_obj := user_record.social_links::text::jsonb;
      ELSE
        -- social_links is already JSONB
        social_obj := user_record.social_links::jsonb;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If parsing fails, treat as empty object
      social_obj := '{}'::jsonb;
      RAISE NOTICE 'Failed to parse social_links for user %: %', user_record.id, SQLERRM;
    END;

    -- Extract location_city
    extracted_location := social_obj->>'location_city';

    -- Extract category_notes
    extracted_category_notes := COALESCE(social_obj->'category_notes', '{}'::jsonb);

    -- Backfill users.location_city ONLY IF it's currently NULL
    IF user_record.current_location_city IS NULL AND extracted_location IS NOT NULL AND extracted_location != '' THEN
      UPDATE public.users
      SET location_city = extracted_location
      WHERE id = user_record.id;
    END IF;

    -- Build games profile object from user columns
    -- ✅ FIXED: Convert text[] to jsonb using to_jsonb()
    game_profile := jsonb_build_object(
      'psn_id', COALESCE(user_record.psn_id, ''),
      'xbox_gamertag', COALESCE(user_record.xbox_gamertag, ''),
      'steam_id', COALESCE(user_record.steam_id, ''),
      'nintendo_id', COALESCE(user_record.nintendo_id, ''),
      'favorite_platform', COALESCE(user_record.favorite_platform, ''),
      'gaming_since', user_record.gaming_since,
      'user_favorite_genres', COALESCE(to_jsonb(user_record.favorite_genres), '[]'::jsonb)
    );

    -- Remove empty string fields and null values from game_profile
    -- ✅ FIXED: Improved filtering logic with COALESCE for null safety
    game_profile := (
      SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
      FROM jsonb_each(game_profile)
      WHERE value IS NOT NULL
        AND value::text != 'null'
        AND value::text != '""'
        AND value::text != '[]'
        AND TRIM(value::text, '"') != ''
    );

    -- Merge category_notes from social_links with games data
    -- If category_notes already has a games key, preserve it and merge with our data
    IF extracted_category_notes ? 'games' THEN
      -- Merge game_profile into existing games object (game_profile takes precedence for duplicates)
      extracted_category_notes := jsonb_set(
        extracted_category_notes,
        '{games}',
        COALESCE(extracted_category_notes->'games', '{}'::jsonb) || game_profile
      );
    ELSE
      -- Add games profile
      extracted_category_notes := extracted_category_notes || jsonb_build_object('games', game_profile);
    END IF;

    -- Upsert into user_category_profiles
    -- Only create/update if there's meaningful data (not empty object)
    IF extracted_category_notes != '{}'::jsonb OR game_profile IS NOT NULL THEN
      INSERT INTO public.user_category_profiles (user_id, profiles)
      VALUES (user_record.id, extracted_category_notes)
      ON CONFLICT (user_id)
      DO UPDATE SET
        profiles = EXCLUDED.profiles,
        updated_at = NOW();
    END IF;
  END LOOP;

  RAISE NOTICE 'Backfill completed for user_category_profiles';
END $$;


-- =====================================================
-- STEP 6: Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_category_profiles_user_id
  ON public.user_category_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_users_location_city
  ON public.users(location_city)
  WHERE location_city IS NOT NULL;


-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
DECLARE
  users_count INT;
  profiles_count INT;
  location_count INT;
BEGIN
  SELECT COUNT(*) INTO users_count FROM public.users;
  SELECT COUNT(*) INTO profiles_count FROM public.user_category_profiles;
  SELECT COUNT(*) INTO location_count FROM public.users WHERE location_city IS NOT NULL;

  RAISE NOTICE '=== Migration Verification ===';
  RAISE NOTICE 'Total users: %', users_count;
  RAISE NOTICE 'Category profiles created: %', profiles_count;
  RAISE NOTICE 'Users with location_city: %', location_count;
END $$;

COMMIT;
