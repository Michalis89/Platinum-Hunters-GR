-- =====================================================
-- Migration 51: Drop Duplicate User Columns
-- =====================================================
-- GOAL: Remove columns that are now stored in user_category_profiles table
--       All these fields are now in user_category_profiles.profiles JSONB
--
-- SAFETY: Run ONLY after verifying the application works 100% with category_profile
--
-- AFFECTED COLUMNS:
--   Game fields: psn_id, xbox_gamertag, steam_id, nintendo_id, favorite_platform, gaming_since
--   Favorite genres: favorite_genres, favorite_anime_genres, favorite_movie_genres, favorite_book_genres
--   Other hobbies: favorite_languages, pet_types, vape_device, vape_flavor
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Drop game-related columns
-- =====================================================
-- These are now in user_category_profiles.profiles.games
ALTER TABLE public.users DROP COLUMN IF EXISTS psn_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS xbox_gamertag;
ALTER TABLE public.users DROP COLUMN IF EXISTS steam_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS nintendo_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS favorite_platform;
ALTER TABLE public.users DROP COLUMN IF EXISTS gaming_since;

-- =====================================================
-- STEP 2: Drop favorite_*_genres columns
-- =====================================================
-- These are now in user_category_profiles.profiles.{category}.genres
ALTER TABLE public.users DROP COLUMN IF EXISTS favorite_genres;          -- Now in profiles.games.user_favorite_genres
ALTER TABLE public.users DROP COLUMN IF EXISTS favorite_anime_genres;    -- Now in profiles.anime.genres
ALTER TABLE public.users DROP COLUMN IF EXISTS favorite_movie_genres;    -- Now in profiles.movies.genres
ALTER TABLE public.users DROP COLUMN IF EXISTS favorite_book_genres;     -- Now in profiles.books.genres

-- =====================================================
-- STEP 3: Drop other hobby-related columns
-- =====================================================
-- These are now in user_category_profiles.profiles.{category}
ALTER TABLE public.users DROP COLUMN IF EXISTS favorite_languages;       -- Now in profiles.coding.languages
ALTER TABLE public.users DROP COLUMN IF EXISTS pet_types;                -- Now in profiles.pet
ALTER TABLE public.users DROP COLUMN IF EXISTS vape_device;              -- Now in profiles.vape.device
ALTER TABLE public.users DROP COLUMN IF EXISTS vape_flavor;              -- Now in profiles.vape.flavors

COMMIT;

-- =====================================================
-- Verification queries (run after migration):
-- =====================================================
-- Check that columns are dropped:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'users'
--   AND table_schema = 'public'
--   AND column_name IN (
--     'psn_id', 'xbox_gamertag', 'steam_id', 'nintendo_id',
--     'favorite_platform', 'gaming_since',
--     'favorite_genres', 'favorite_anime_genres', 'favorite_movie_genres', 'favorite_book_genres',
--     'favorite_languages', 'pet_types', 'vape_device', 'vape_flavor'
--   );
-- Should return 0 rows

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. This is a BREAKING migration - only run after code is updated
-- 2. Data is preserved in user_category_profiles table
-- 3. Rollback: Re-create columns and backfill from user_category_profiles
-- 4. Performance: Dropping columns is fast (metadata-only in PostgreSQL)
