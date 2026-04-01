-- DnD soft deletes + trash recovery (30-day restore window)

-- 1) Add deleted_at columns
alter table public.campaign_sessions add column if not exists deleted_at timestamptz;
alter table public.campaign_npcs add column if not exists deleted_at timestamptz;
alter table public.campaign_locations add column if not exists deleted_at timestamptz;
alter table public.campaign_quests add column if not exists deleted_at timestamptz;
alter table public.campaign_handouts add column if not exists deleted_at timestamptz;
alter table public.campaign_assets add column if not exists deleted_at timestamptz;
alter table public.campaigns add column if not exists deleted_at timestamptz;

-- 2) Indexes
create index if not exists idx_campaign_sessions_deleted on public.campaign_sessions(deleted_at) where deleted_at is not null;
create index if not exists idx_campaign_npcs_deleted on public.campaign_npcs(deleted_at) where deleted_at is not null;
create index if not exists idx_campaign_locations_deleted on public.campaign_locations(deleted_at) where deleted_at is not null;
create index if not exists idx_campaign_quests_deleted on public.campaign_quests(deleted_at) where deleted_at is not null;
create index if not exists idx_campaign_handouts_deleted on public.campaign_handouts(deleted_at) where deleted_at is not null;
create index if not exists idx_campaign_assets_deleted on public.campaign_assets(deleted_at) where deleted_at is not null;
create index if not exists idx_campaigns_deleted on public.campaigns(deleted_at) where deleted_at is not null;

-- 3) Update RLS select policies to hide soft-deleted rows for non-DM readers

-- campaigns
drop policy if exists "members read campaigns" on public.campaigns;
create policy "members read campaigns" on public.campaigns
  for select
  using (public.is_campaign_member(id) and deleted_at is null);

-- campaign_sessions
drop policy if exists "players read published sessions" on public.campaign_sessions;
create policy "players read published sessions" on public.campaign_sessions
  for select
  using (public.is_campaign_member(campaign_id) and recap_published = true and deleted_at is null);

-- campaign_npcs
drop policy if exists "players read published npcs" on public.campaign_npcs;
create policy "players read published npcs" on public.campaign_npcs
  for select
  using (public.is_campaign_member(campaign_id) and published = true and deleted_at is null);

-- campaign_locations
drop policy if exists "players read published locations" on public.campaign_locations;
create policy "players read published locations" on public.campaign_locations
  for select
  using (public.is_campaign_member(campaign_id) and published = true and deleted_at is null);

-- campaign_quests
drop policy if exists "players read published quests" on public.campaign_quests;
create policy "players read published quests" on public.campaign_quests
  for select
  using (public.is_campaign_member(campaign_id) and published = true and deleted_at is null);

-- campaign_handouts
drop policy if exists "players read published handouts" on public.campaign_handouts;
create policy "players read published handouts" on public.campaign_handouts
  for select
  using (public.is_campaign_member(campaign_id) and published = true and deleted_at is null);

-- campaign_assets
drop policy if exists "players read published assets" on public.campaign_assets;
create policy "players read published assets" on public.campaign_assets
  for select
  using (public.is_campaign_member(campaign_id) and published = true and deleted_at is null);

-- 4) Purge function for records deleted > 30 days
create or replace function public.purge_old_dnd_deletes()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.campaign_sessions where deleted_at < now() - interval '30 days';
  delete from public.campaign_npcs where deleted_at < now() - interval '30 days';
  delete from public.campaign_locations where deleted_at < now() - interval '30 days';
  delete from public.campaign_quests where deleted_at < now() - interval '30 days';
  delete from public.campaign_handouts where deleted_at < now() - interval '30 days';
  delete from public.campaign_assets where deleted_at < now() - interval '30 days';
  delete from public.campaigns where deleted_at < now() - interval '30 days';
end;
$$;

-- 5) Test helper: purge with custom window (for manual testing only — not exposed via API)
-- Usage: select public.purge_old_dnd_deletes_test('1 minute');
create or replace function public.purge_old_dnd_deletes_test(older_than interval default '1 minute')
returns table(
  entity text,
  deleted_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sessions bigint;
  v_npcs     bigint;
  v_locs     bigint;
  v_quests   bigint;
  v_handouts bigint;
  v_assets   bigint;
  v_campaigns bigint;
begin
  with d as (delete from public.campaign_sessions where deleted_at < now() - older_than returning id)
    select count(*) into v_sessions from d;
  with d as (delete from public.campaign_npcs where deleted_at < now() - older_than returning id)
    select count(*) into v_npcs from d;
  with d as (delete from public.campaign_locations where deleted_at < now() - older_than returning id)
    select count(*) into v_locs from d;
  with d as (delete from public.campaign_quests where deleted_at < now() - older_than returning id)
    select count(*) into v_quests from d;
  with d as (delete from public.campaign_handouts where deleted_at < now() - older_than returning id)
    select count(*) into v_handouts from d;
  with d as (delete from public.campaign_assets where deleted_at < now() - older_than returning id)
    select count(*) into v_assets from d;
  with d as (delete from public.campaigns where deleted_at < now() - older_than returning id)
    select count(*) into v_campaigns from d;

  return query values
    ('sessions',  v_sessions),
    ('npcs',      v_npcs),
    ('locations', v_locs),
    ('quests',    v_quests),
    ('handouts',  v_handouts),
    ('assets',    v_assets),
    ('campaigns', v_campaigns);
end;
$$;

-- 6) Schedule daily purge via pg_cron (03:00 UTC)
-- Prerequisites: enable pg_cron from Supabase Dashboard → Database → Extensions
do $$
begin
  perform cron.unschedule('purge-dnd-deletes');
exception when others then null;
end $$;

select cron.schedule(
  'purge-dnd-deletes',
  '0 3 * * *',
  $$select public.purge_old_dnd_deletes()$$
);
