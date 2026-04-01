create table if not exists public.campaign_npcs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null,
  role text,
  status text not null default 'unknown' check (status in ('alive','dead','unknown')),
  description text,
  tags text[] not null default '{}'::text[],
  public_notes text,
  secret_notes text,
  published boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_campaign_npcs_campaign_id on public.campaign_npcs(campaign_id);

create table if not exists public.campaign_locations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null,
  type text,
  description text,
  tags text[] not null default '{}'::text[],
  public_notes text,
  secret_notes text,
  published boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_campaign_locations_campaign_id on public.campaign_locations(campaign_id);

create table if not exists public.campaign_quests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  title text not null,
  status text not null default 'active' check (status in ('active','completed','failed','on_hold')),
  summary text,
  public_notes text,
  secret_notes text,
  published boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_campaign_quests_campaign_id on public.campaign_quests(campaign_id);

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'dnd_entity_type'
      and n.nspname = 'public'
  ) then
    create type public.dnd_entity_type as enum ('npc','location','quest');
  end if;
end
$$;

create table if not exists public.campaign_entity_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  session_id uuid not null references public.campaign_sessions(id) on delete cascade,
  entity_type public.dnd_entity_type not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (session_id, entity_type, entity_id)
);

create index if not exists idx_campaign_entity_links_campaign_id on public.campaign_entity_links(campaign_id);

