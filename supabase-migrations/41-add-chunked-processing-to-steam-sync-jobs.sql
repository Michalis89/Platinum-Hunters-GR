-- Add chunked processing support to steam_sync_jobs table
-- This enables processing large Steam libraries in batches to avoid Vercel timeouts

-- Add new columns for chunked processing
ALTER TABLE public.steam_sync_jobs
ADD COLUMN IF NOT EXISTS steam_games JSONB,
ADD COLUMN IF NOT EXISTS processed_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS batch_size INTEGER NOT NULL DEFAULT 25;

-- Add comment explaining the new columns
COMMENT ON COLUMN public.steam_sync_jobs.steam_games IS 'Array of Steam games to process (includes appid, name, playtime, etc.)';
COMMENT ON COLUMN public.steam_sync_jobs.processed_count IS 'Number of games that have been processed so far';
COMMENT ON COLUMN public.steam_sync_jobs.batch_size IS 'Number of games to process per batch (default: 25)';
