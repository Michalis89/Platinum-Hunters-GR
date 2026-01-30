-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 26: Add Owner Role + Elevation Helpers
-- =====================================================

-- =====================================================
-- ROLE MODEL UPDATE
-- =====================================================

-- Expand role check constraint to include owner
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'author', 'moderator', 'admin', 'owner'));

-- =====================================================
-- HELPER FUNCTIONS (OWNER INCLUDED)
-- =====================================================

-- Elevated admin check (admin + owner)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'owner')
  );
$$;

-- Elevated admin or moderator check (admin + owner + moderator)
CREATE OR REPLACE FUNCTION public.is_admin_or_moderator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'owner', 'moderator')
  );
$$;

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Owner role enabled and helper functions updated.';
END $$;
