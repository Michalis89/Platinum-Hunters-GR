-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 8: Sync auth.users with public.users
-- Ticket: PH-30 - User Authentication System
-- =====================================================

-- =====================================================
-- FUNCTION: Create public user from auth user
-- =====================================================

-- This function creates a public.users record whenever a new auth.users record is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    username,
    display_name,
    role,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- Generate temporary username from email (user can change it later)
    SPLIT_PART(NEW.email, '@', 1),
    -- Use email prefix as display name initially
    SPLIT_PART(NEW.email, '@', 1),
    -- Default role
    'user',
    -- Email verified status from auth
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END,
    -- Timestamps
    NEW.created_at,
    NEW.updated_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: On auth.users insert
-- =====================================================

-- Drop trigger if exists (for re-running migration)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FUNCTION: Update email_verified when email is confirmed
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_user_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  -- When email_confirmed_at changes from NULL to a value, update public.users
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users
    SET email_verified = TRUE
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: On auth.users email confirmation
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;

CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_verified();

-- =====================================================
-- FUNCTION: Update last_login timestamp
-- =====================================================

-- Note: This function should be called from the login API route
-- We can't trigger on auth.sessions because Supabase handles that internally
CREATE OR REPLACE FUNCTION public.update_user_last_login(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET last_login = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLICY: Allow users to call update_last_login on themselves
-- =====================================================

-- This is handled by RLS - users can update their own record via the existing policy

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Auth sync triggers created successfully!';
  RAISE NOTICE 'ℹ️  New auth users will automatically create public.users records';
  RAISE NOTICE 'ℹ️  Email verification will sync to public.users';
END $$;
