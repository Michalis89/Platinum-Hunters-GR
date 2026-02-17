-- =====================================================
-- Migration 50: Cleanup social_links JSON
-- =====================================================
-- GOAL: Remove location_city and category_notes from social_links
--       They are now stored in dedicated structures:
--       - users.location_city (dedicated column)
--       - user_category_profiles.profiles (dedicated table)
--
-- SAFETY: Run ONLY after verifying the application works 100% with new fields
-- =====================================================

BEGIN;

-- Remove location_city and category_notes from social_links
UPDATE public.users
SET social_links = social_links - 'location_city' - 'category_notes'
WHERE social_links IS NOT NULL
  AND (
    social_links ? 'location_city' OR
    social_links ? 'category_notes'
  );

COMMIT;

-- Verification query (run after migration):
-- SELECT COUNT(*) FROM users WHERE social_links ? 'location_city'; -- Should be 0
-- SELECT COUNT(*) FROM users WHERE social_links ? 'category_notes'; -- Should be 0
