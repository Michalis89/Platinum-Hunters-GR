-- =====================================================
-- HOBBISTA HUB - DATABASE MIGRATION
-- Part 29: Remove legacy `role` column (keep only `roles[]`)
-- Idempotent — safe to re-run if partially applied
-- =====================================================

-- =====================================================
-- STEP 1: Safety — migrate role → roles[] (only if column still exists)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
  ) THEN
    -- Copy role into roles[] where roles is empty
    UPDATE public.users
    SET roles = ARRAY[role]
    WHERE (roles IS NULL OR array_length(roles, 1) IS NULL)
      AND role IS NOT NULL;

    UPDATE public.users
    SET roles = ARRAY['user']
    WHERE roles IS NULL OR array_length(roles, 1) IS NULL;

    -- Merge role into roles[] if not already there
    UPDATE public.users
    SET roles = array_append(roles, role)
    WHERE role IS NOT NULL
      AND NOT (role = ANY(roles));
  END IF;
END $$;

-- =====================================================
-- STEP 2: Drop the sync trigger (no longer needed)
-- =====================================================

DROP TRIGGER IF EXISTS trigger_sync_user_roles ON public.users;
DROP FUNCTION IF EXISTS public.sync_user_roles();

-- =====================================================
-- STEP 3: Drop ALL dependent objects before dropping role
-- =====================================================

-- Storage RLS policies that reference role
DROP POLICY IF EXISTS "Article cover uploads by editors" ON storage.objects;
DROP POLICY IF EXISTS "Article cover deletes by editors" ON storage.objects;

-- Views that reference role
DROP VIEW IF EXISTS user_stats CASCADE;

-- =====================================================
-- STEP 4: Drop the role column and its constraint
-- =====================================================

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  DROP COLUMN IF EXISTS role;

-- STEP 5: user_stats view was dropped above — it referenced
-- legacy tables (user_backlog, user_completed_games, guides, comments)
-- that no longer exist and was unused in app code. Not recreating.

-- =====================================================
-- STEP 6: Recreate storage policies using roles[]
-- =====================================================

CREATE POLICY "Article cover uploads by editors" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'articles'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.roles && ARRAY['admin','owner','author','reviewer']
    )
  );

CREATE POLICY "Article cover deletes by editors" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'articles'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.roles && ARRAY['admin','owner','author','reviewer']
    )
  );

-- =====================================================
-- STEP 7: Update has_any_role() to only use roles[]
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_any_role(required_roles TEXT[])
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
      AND u.roles && required_roles
  );
$$;

-- =====================================================
-- STEP 8: Update handle_new_user() — remove role column
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    username,
    display_name,
    roles,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    SPLIT_PART(NEW.email, '@', 1),
    SPLIT_PART(NEW.email, '@', 1),
    ARRAY['user'],
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END,
    NEW.created_at,
    NEW.updated_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 9: Update is_admin / is_admin_or_moderator
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.has_any_role(ARRAY['admin', 'owner']);
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_moderator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.has_any_role(ARRAY['admin', 'owner', 'moderator']);
$$;

-- =====================================================
-- Done
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 29 complete: role column dropped, roles[] is now the single source of truth.';
END $$;
