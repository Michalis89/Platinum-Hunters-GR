-- =====================================================
-- HOBBISTAS HUB - MAL INTEGRATIONS + SYNC SAFETY INDEXES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_integrations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('mal')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS user_integrations_user_provider_idx
  ON public.user_integrations (user_id, provider);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own integrations" ON public.user_integrations;
CREATE POLICY "Users can view own integrations"
  ON public.user_integrations FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own integrations" ON public.user_integrations;
CREATE POLICY "Users can insert own integrations"
  ON public.user_integrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own integrations" ON public.user_integrations;
CREATE POLICY "Users can update own integrations"
  ON public.user_integrations FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own integrations" ON public.user_integrations;
CREATE POLICY "Users can delete own integrations"
  ON public.user_integrations FOR DELETE
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_user_integrations_updated ON public.user_integrations;
CREATE TRIGGER trg_user_integrations_updated
BEFORE UPDATE ON public.user_integrations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS media_items_source_mal_id_uq
  ON public.media_items (source, mal_id)
  WHERE mal_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_media_entries_user_media_uq
  ON public.user_media_entries (user_id, media_id);
