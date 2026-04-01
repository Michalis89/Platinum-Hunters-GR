create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  dm_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  system text not null,
  description text,
  invite_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invite_token)
);

create table if not exists public.campaign_members (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('dm','co_dm','player')),
  joined_at timestamptz not null default now(),
  unique (campaign_id, user_id)
);

create index if not exists idx_campaign_members_campaign_id on public.campaign_members(campaign_id);
create index if not exists idx_campaign_members_user_id on public.campaign_members(user_id);

