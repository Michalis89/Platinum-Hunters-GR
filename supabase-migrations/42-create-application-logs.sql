-- Application-wide logs for admin support visibility

CREATE TABLE IF NOT EXISTS public.application_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  path TEXT,
  method TEXT,
  status INTEGER,
  duration_ms INTEGER,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_application_logs_created_at
  ON public.application_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_application_logs_level
  ON public.application_logs(level);

CREATE INDEX IF NOT EXISTS idx_application_logs_path
  ON public.application_logs(path);

ALTER TABLE public.application_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view application logs" ON public.application_logs;
CREATE POLICY "Admins can view application logs"
  ON public.application_logs
  FOR SELECT
  USING (public.is_admin_or_moderator());
