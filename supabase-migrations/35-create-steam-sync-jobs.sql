-- Create steam_sync_jobs table for persistent job tracking (required for serverless async mode)
CREATE TABLE IF NOT EXISTS public.steam_sync_jobs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  message TEXT NOT NULL DEFAULT 'Ξεκινά ο συγχρονισμός Steam...',
  percent INTEGER NOT NULL DEFAULT 0 CHECK (percent >= 0 AND percent <= 100),
  completed_steps INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL DEFAULT 1,
  error TEXT,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes')
);

-- Create index on user_id and status for efficient queries
CREATE INDEX IF NOT EXISTS idx_steam_sync_jobs_user_id ON public.steam_sync_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_steam_sync_jobs_status ON public.steam_sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_steam_sync_jobs_expires_at ON public.steam_sync_jobs(expires_at);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_steam_sync_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_steam_sync_jobs_updated_at
  BEFORE UPDATE ON public.steam_sync_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_steam_sync_jobs_updated_at();

-- Create function to cleanup expired jobs (older than 30 minutes)
CREATE OR REPLACE FUNCTION cleanup_expired_steam_sync_jobs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.steam_sync_jobs
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS Policies: Users can only see their own jobs
ALTER TABLE public.steam_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own steam sync jobs"
  ON public.steam_sync_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own steam sync jobs"
  ON public.steam_sync_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own steam sync jobs"
  ON public.steam_sync_jobs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own steam sync jobs"
  ON public.steam_sync_jobs
  FOR DELETE
  USING (auth.uid() = user_id);
