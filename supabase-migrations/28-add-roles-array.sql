-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 28: Multi-role support (roles[])
-- =====================================================

-- =====================================================
-- USERS: ADD roles[] COLUMN + CONSTRAINTS
-- =====================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS roles TEXT[];

UPDATE public.users
SET roles = ARRAY[role]
WHERE roles IS NULL AND role IS NOT NULL;

UPDATE public.users
SET roles = ARRAY['user']
WHERE roles IS NULL;

ALTER TABLE public.users
  ALTER COLUMN roles SET DEFAULT ARRAY['user']::TEXT[],
  ALTER COLUMN roles SET NOT NULL;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_roles_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_roles_check
  CHECK (roles <@ ARRAY['user', 'author', 'reviewer', 'moderator', 'admin', 'owner']::TEXT[]);

-- =====================================================
-- TRIGGER: Keep role + roles in sync (backwards compatibility)
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.roles IS NULL OR array_length(NEW.roles, 1) IS NULL THEN
    IF NEW.role IS NOT NULL THEN
      NEW.roles := ARRAY[NEW.role];
    ELSE
      NEW.roles := ARRAY['user'];
    END IF;
  END IF;

  IF NEW.role IS NULL AND array_length(NEW.roles, 1) IS NOT NULL THEN
    NEW.role := NEW.roles[1];
  END IF;

  IF NEW.role IS NOT NULL AND NOT (NEW.role = ANY(NEW.roles)) THEN
    NEW.roles := array_append(NEW.roles, NEW.role);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_user_roles ON public.users;
CREATE TRIGGER trigger_sync_user_roles
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_roles();

-- =====================================================
-- HELPER FUNCTIONS (ADMIN / MODERATOR)
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
      AND (
        u.role = ANY(required_roles)
        OR (u.roles IS NOT NULL AND u.roles && required_roles)
      )
  );
$$;

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
-- AUTH SYNC: ensure roles[] is set for new users
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    username,
    display_name,
    role,
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
    'user',
    ARRAY['user'],
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END,
    NEW.created_at,
    NEW.updated_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Multi-role support enabled (roles[] + helper functions).';
END $$;
