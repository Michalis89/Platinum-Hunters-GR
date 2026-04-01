create table if not exists public.campaign_sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  title text not null,
  session_date timestamptz,
  status text not null default 'planned' check (status in ('planned','played','cancelled')),
  agenda text,
  recap text,
  dm_notes text,
  recap_published boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_session_attendance (
  session_id uuid not null references public.campaign_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (session_id, user_id)
);

create index if not exists idx_campaign_sessions_campaign_id on public.campaign_sessions(campaign_id);

