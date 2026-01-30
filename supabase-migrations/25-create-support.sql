-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 25: Support Tickets & Attachments
-- =====================================================

-- =====================================================
-- TABLES
-- =====================================================

-- Ensure UUID generator exists (preferred over uuid-ossp)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure updated_at trigger helper exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure is_admin() helper exists (based on public.users.role)
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

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NULL,
  name TEXT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'author_rights', 'general')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  severity TEXT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  environment JSONB NULL,
  meta JSONB NULL,
  assigned_to UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  labels TEXT[] NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  author_role TEXT NOT NULL DEFAULT 'user' CHECK (author_role IN ('user', 'admin', 'system')),
  message TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  message_id UUID NULL REFERENCES support_messages(id) ON DELETE SET NULL,
  uploader_user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  file_name TEXT,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_ticket_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('status_change', 'assignment', 'label_change')),
  payload JSONB NULL,
  actor_user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS support_tickets_user_created_idx
  ON support_tickets (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS support_tickets_status_created_idx
  ON support_tickets (status, created_at DESC);

CREATE INDEX IF NOT EXISTS support_tickets_category_created_idx
  ON support_tickets (category, created_at DESC);

CREATE INDEX IF NOT EXISTS support_messages_ticket_created_idx
  ON support_messages (ticket_id, created_at);

CREATE INDEX IF NOT EXISTS support_attachments_ticket_idx
  ON support_attachments (ticket_id);

CREATE INDEX IF NOT EXISTS support_attachments_message_idx
  ON support_attachments (message_id);

CREATE INDEX IF NOT EXISTS support_ticket_events_ticket_idx
  ON support_ticket_events (ticket_id, created_at);

CREATE INDEX IF NOT EXISTS support_tickets_environment_gin
  ON support_tickets USING GIN (environment);

-- =====================================================
-- TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER trigger_update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION touch_support_ticket_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE support_tickets
  SET updated_at = NOW()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_touch_support_ticket_on_message ON support_messages;
CREATE TRIGGER trigger_touch_support_ticket_on_message
  AFTER INSERT ON support_messages
  FOR EACH ROW EXECUTE FUNCTION touch_support_ticket_on_message();

-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_events ENABLE ROW LEVEL SECURITY;

-- Support tickets: read own or admin
DROP POLICY IF EXISTS "Support tickets are viewable by owners" ON support_tickets;
CREATE POLICY "Support tickets are viewable by owners"
  ON support_tickets FOR SELECT
  USING (
    (user_id = auth.uid())
    OR public.is_admin()
  );

-- Support tickets: insert (authenticated users only)
DROP POLICY IF EXISTS "Support tickets insert by owner" ON support_tickets;
CREATE POLICY "Support tickets insert by owner"
  ON support_tickets FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

-- Support tickets: admin update
DROP POLICY IF EXISTS "Support tickets admin update" ON support_tickets;
CREATE POLICY "Support tickets admin update"
  ON support_tickets FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Support messages: read own ticket (excluding internal) or admin
DROP POLICY IF EXISTS "Support messages are viewable by ticket owner" ON support_messages;
CREATE POLICY "Support messages are viewable by ticket owner"
  ON support_messages FOR SELECT
  USING (
    (is_internal = false AND EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = support_messages.ticket_id
      AND st.user_id = auth.uid()
    ))
    OR public.is_admin()
  );

-- Support messages: insert by owner or admin
DROP POLICY IF EXISTS "Support messages insert by owner" ON support_messages;
CREATE POLICY "Support messages insert by owner"
  ON support_messages FOR INSERT
  WITH CHECK (
    (
      auth.uid() IS NOT NULL
      AND author_user_id = auth.uid()
      AND author_role = 'user'
      AND is_internal = false
      AND EXISTS (
        SELECT 1 FROM support_tickets st
        WHERE st.id = support_messages.ticket_id
        AND st.user_id = auth.uid()
      )
    )
    OR (
      public.is_admin()
      AND author_role IN ('admin', 'system')
    )
  );

-- Support attachments: read own or admin (exclude internal message attachments)
DROP POLICY IF EXISTS "Support attachments are viewable by ticket owner" ON support_attachments;
CREATE POLICY "Support attachments are viewable by ticket owner"
  ON support_attachments FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1
        FROM support_tickets st
        LEFT JOIN support_messages sm ON sm.id = support_attachments.message_id
        WHERE st.id = support_attachments.ticket_id
        AND st.user_id = auth.uid()
        AND COALESCE(sm.is_internal, false) = false
      )
    )
    OR public.is_admin()
  );

-- Support attachments: insert by owner or anonymous or admin
DROP POLICY IF EXISTS "Support attachments insert by owner" ON support_attachments;
CREATE POLICY "Support attachments insert by owner"
  ON support_attachments FOR INSERT
  WITH CHECK (
    (
      auth.uid() IS NOT NULL
      AND uploader_user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM support_tickets st
        WHERE st.id = support_attachments.ticket_id
        AND st.user_id = auth.uid()
      )
    )
    OR public.is_admin()
  );

-- Support ticket events: read own or admin
DROP POLICY IF EXISTS "Support ticket events are viewable by ticket owner" ON support_ticket_events;
CREATE POLICY "Support ticket events are viewable by ticket owner"
  ON support_ticket_events FOR SELECT
  USING (
    (EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = support_ticket_events.ticket_id
      AND st.user_id = auth.uid()
    ))
    OR public.is_admin()
  );

-- Support ticket events: admin insert
DROP POLICY IF EXISTS "Support ticket events admin insert" ON support_ticket_events;
CREATE POLICY "Support ticket events admin insert"
  ON support_ticket_events FOR INSERT
  WITH CHECK (public.is_admin());

-- =====================================================
-- STORAGE BUCKET (PRIVATE)
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-attachments',
  'support-attachments',
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (read only via table ownership)
DROP POLICY IF EXISTS "Support attachments read" ON storage.objects;
CREATE POLICY "Support attachments read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'support-attachments'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.support_attachments sa
        JOIN public.support_tickets st ON st.id = sa.ticket_id
        LEFT JOIN public.support_messages sm ON sm.id = sa.message_id
        WHERE sa.storage_path = storage.objects.name
        AND st.user_id = auth.uid()
        AND COALESCE(sm.is_internal, false) = false
      )
    )
  );

-- NOTE: Uploads are performed server-side with the service role.
-- Client-side INSERT/DELETE policies on storage.objects are intentionally omitted.

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Support tables and policies created successfully!';
END $$;
