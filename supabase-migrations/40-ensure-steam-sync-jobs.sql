-- Ensure steam_sync_jobs table exists (idempotent)
-- This is needed for the Steam sync background job tracking system

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_steam_sync_jobs_user_id ON public.steam_sync_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_steam_sync_jobs_status ON public.steam_sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_steam_sync_jobs_expires_at ON public.steam_sync_jobs(expires_at);

-- Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_steam_sync_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_steam_sync_jobs_updated_at ON public.steam_sync_jobs;
CREATE TRIGGER trigger_update_steam_sync_jobs_updated_at
  BEFORE UPDATE ON public.steam_sync_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_steam_sync_jobs_updated_at();

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_steam_sync_jobs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.steam_sync_jobs
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.steam_sync_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own steam sync jobs" ON public.steam_sync_jobs;
DROP POLICY IF EXISTS "Users can insert own steam sync jobs" ON public.steam_sync_jobs;
DROP POLICY IF EXISTS "Users can update own steam sync jobs" ON public.steam_sync_jobs;
DROP POLICY IF EXISTS "Users can delete own steam sync jobs" ON public.steam_sync_jobs;

-- Create RLS policies
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
