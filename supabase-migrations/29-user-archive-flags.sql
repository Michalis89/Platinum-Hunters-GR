-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 29: User archive/delete flags for support tickets
-- =====================================================

-- Columns for per-user archiving/deleting (soft, user-side only)
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS user_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_deleted BOOLEAN NOT NULL DEFAULT false;

-- Helper function: allow ticket owner to toggle archive/delete safely
CREATE OR REPLACE FUNCTION public.user_set_support_ticket_flags(
  p_ticket_id UUID,
  p_archived BOOLEAN DEFAULT NULL,
  p_deleted BOOLEAN DEFAULT NULL
)
RETURNS public.support_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  updated_row public.support_tickets;
BEGIN
  UPDATE public.support_tickets
  SET
    user_archived = COALESCE(p_archived, user_archived),
    user_deleted  = COALESCE(p_deleted, user_deleted),
    updated_at    = NOW()
  WHERE id = p_ticket_id
    AND user_id = auth.uid()
  RETURNING * INTO updated_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND_OR_FORBIDDEN';
  END IF;

  RETURN updated_row;
END;
$$;

-- Success notice
DO $$
BEGIN
  RAISE NOTICE '✅ Support tickets now support user archive/delete flags.';
END $$;
