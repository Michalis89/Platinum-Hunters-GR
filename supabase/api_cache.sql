create table if not exists public.api_cache (
  key text primary key,
  data jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_cache_expires_at on public.api_cache (expires_at);

-- Only the service role (server-side) should access this table.
-- Service role bypasses RLS, so no policies are needed here.
alter table public.api_cache enable row level security;
