-- Rollback migration: Drop steam_sync_jobs table and related objects
-- This reverses migration 35-create-steam-sync-jobs.sql

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view own steam sync jobs" ON public.steam_sync_jobs;
DROP POLICY IF EXISTS "Users can insert own steam sync jobs" ON public.steam_sync_jobs;
DROP POLICY IF EXISTS "Users can update own steam sync jobs" ON public.steam_sync_jobs;
DROP POLICY IF EXISTS "Users can delete own steam sync jobs" ON public.steam_sync_jobs;

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_update_steam_sync_jobs_updated_at ON public.steam_sync_jobs;

-- Drop functions
DROP FUNCTION IF EXISTS update_steam_sync_jobs_updated_at();
DROP FUNCTION IF EXISTS cleanup_expired_steam_sync_jobs();

-- Drop table (CASCADE will drop indexes automatically)
DROP TABLE IF EXISTS public.steam_sync_jobs CASCADE;
