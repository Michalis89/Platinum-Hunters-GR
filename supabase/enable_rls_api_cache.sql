-- Enable RLS on api_cache.
-- This table is only accessed via the service role key (server-side),
-- which bypasses RLS, so no policies are needed.
-- Enabling RLS blocks all direct anon/authenticated access.
alter table public.api_cache enable row level security;
