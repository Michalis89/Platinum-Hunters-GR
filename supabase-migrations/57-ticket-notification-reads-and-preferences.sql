-- =====================================================
-- HOBBISTAS HUB - DATABASE MIGRATION
-- Part 57: Ticket notification read-state and preferences
-- =====================================================

-- Notification preferences (extensible foundation for future follows/DMs)
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS ticket_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS follows_notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dms_notifications_enabled BOOLEAN NOT NULL DEFAULT false;

-- Per-user read cursor for support tickets
CREATE TABLE IF NOT EXISTS public.support_ticket_reads (
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (ticket_id, user_id)
);

CREATE INDEX IF NOT EXISTS support_ticket_reads_user_id_idx
  ON public.support_ticket_reads (user_id, last_read_at DESC);

ALTER TABLE public.support_ticket_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Support ticket reads are viewable by owner" ON public.support_ticket_reads;
CREATE POLICY "Support ticket reads are viewable by owner"
  ON public.support_ticket_reads
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Support ticket reads insert by owner" ON public.support_ticket_reads;
CREATE POLICY "Support ticket reads insert by owner"
  ON public.support_ticket_reads
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.is_admin_or_moderator()
      OR EXISTS (
        SELECT 1
        FROM public.support_tickets st
        WHERE st.id = support_ticket_reads.ticket_id
          AND st.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Support ticket reads update by owner" ON public.support_ticket_reads;
CREATE POLICY "Support ticket reads update by owner"
  ON public.support_ticket_reads
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.is_admin_or_moderator()
      OR EXISTS (
        SELECT 1
        FROM public.support_tickets st
        WHERE st.id = support_ticket_reads.ticket_id
          AND st.user_id = auth.uid()
      )
    )
  );

CREATE OR REPLACE FUNCTION public.mark_support_ticket_as_read(p_ticket_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_allowed BOOLEAN := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.support_tickets st
    WHERE st.id = p_ticket_id
      AND (
        st.user_id = v_uid
        OR public.is_admin_or_moderator()
      )
  )
  INTO v_allowed;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'NOT_FOUND_OR_FORBIDDEN';
  END IF;

  INSERT INTO public.support_ticket_reads (ticket_id, user_id, last_read_at)
  VALUES (p_ticket_id, v_uid, NOW())
  ON CONFLICT (ticket_id, user_id)
  DO UPDATE SET last_read_at = EXCLUDED.last_read_at;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ticket_unread_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_count INTEGER := 0;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 0;
  END IF;

  IF public.is_admin_or_moderator() THEN
    SELECT COUNT(*)::INTEGER
      INTO v_count
    FROM public.support_messages sm
    JOIN public.support_tickets st ON st.id = sm.ticket_id
    LEFT JOIN public.support_ticket_reads str
      ON str.ticket_id = st.id
     AND str.user_id = v_uid
    WHERE sm.author_role = 'user'
      AND COALESCE(sm.is_internal, false) = false
      AND sm.created_at > COALESCE(str.last_read_at, st.created_at, TO_TIMESTAMP(0));
  ELSE
    SELECT COUNT(*)::INTEGER
      INTO v_count
    FROM public.support_messages sm
    JOIN public.support_tickets st ON st.id = sm.ticket_id
    LEFT JOIN public.support_ticket_reads str
      ON str.ticket_id = st.id
     AND str.user_id = v_uid
    WHERE st.user_id = v_uid
      AND st.user_deleted = false
      AND sm.author_role = 'admin'
      AND COALESCE(sm.is_internal, false) = false
      AND sm.created_at > COALESCE(str.last_read_at, st.created_at, TO_TIMESTAMP(0));
  END IF;

  RETURN COALESCE(v_count, 0);
END;
$$;

DO $$
BEGIN
  RAISE NOTICE 'Ticket notification read-state and preferences created.';
END $$;
