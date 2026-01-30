-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 27: Add Reviewer Role
-- =====================================================

-- Expand role check constraint to include reviewer
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'author', 'reviewer', 'moderator', 'admin', 'owner'));

DO $$
BEGIN
  RAISE NOTICE '✅ Reviewer role enabled.';
END $$;
