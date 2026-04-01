-- DnD Module RLS policies
-- Prompt 02: helper functions, RLS enablement, and per-table policies

-- 1) Helper functions
create or replace function public.is_campaign_dm(cid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaign_members
    where campaign_id = cid
      and user_id = auth.uid()
      and role in ('dm', 'co_dm')
  );
$$;

create or replace function public.is_campaign_member(cid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaign_members
    where campaign_id = cid
      and user_id = auth.uid()
  );
$$;

-- 2) Enable RLS in all DnD tables
alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.campaign_sessions enable row level security;
alter table public.campaign_session_attendance enable row level security;
alter table public.campaign_npcs enable row level security;
alter table public.campaign_locations enable row level security;
alter table public.campaign_quests enable row level security;
alter table public.campaign_entity_links enable row level security;
alter table public.campaign_handouts enable row level security;
alter table public.campaign_assets enable row level security;
alter table public.character_sheets enable row level security;

-- 3) Policies

-- campaigns: DM full access + members read
drop policy if exists "dm manages own campaigns" on public.campaigns;
create policy "dm manages own campaigns" on public.campaigns
  for all
  using (auth.uid() = dm_id)
  with check (auth.uid() = dm_id);

drop policy if exists "members read campaigns" on public.campaigns;
create policy "members read campaigns" on public.campaigns
  for select
  using (public.is_campaign_member(id));

-- campaign_members: own membership read + DM manages membership
drop policy if exists "members read own membership" on public.campaign_members;
create policy "members read own membership" on public.campaign_members
  for select
  using (auth.uid() = user_id);

drop policy if exists "dm manages membership" on public.campaign_members;
drop policy if exists "dm reads membership" on public.campaign_members;
drop policy if exists "dm inserts membership" on public.campaign_members;
drop policy if exists "dm updates membership" on public.campaign_members;
drop policy if exists "dm deletes membership" on public.campaign_members;
drop policy if exists "campaign owner bootstraps dm membership" on public.campaign_members;

create policy "dm reads membership" on public.campaign_members
  for select
  using (public.is_campaign_dm(campaign_id));

create policy "dm inserts membership" on public.campaign_members
  for insert
  with check (public.is_campaign_dm(campaign_id));

create policy "dm updates membership" on public.campaign_members
  for update
  using (public.is_campaign_dm(campaign_id))
  with check (public.is_campaign_dm(campaign_id));

create policy "dm deletes membership" on public.campaign_members
  for delete
  using (public.is_campaign_dm(campaign_id));

-- Initial bootstrap row: campaign creator can add themself as dm member.
create policy "campaign owner bootstraps dm membership" on public.campaign_members
  for insert
  with check (
    role = 'dm'
    and user_id = auth.uid()
    and exists (
      select 1
      from public.campaigns c
      where c.id = campaign_id
        and c.dm_id = auth.uid()
    )
  );

-- campaign_sessions: DM full + players read published recap only
drop policy if exists "dm manages sessions" on public.campaign_sessions;
create policy "dm manages sessions" on public.campaign_sessions
  for all
  using (public.is_campaign_dm(campaign_id))
  with check (public.is_campaign_dm(campaign_id));

drop policy if exists "players read published sessions" on public.campaign_sessions;
create policy "players read published sessions" on public.campaign_sessions
  for select
  using (public.is_campaign_member(campaign_id) and recap_published = true);

-- campaign_session_attendance: DM full + members read
drop policy if exists "dm manages attendance" on public.campaign_session_attendance;
create policy "dm manages attendance" on public.campaign_session_attendance
  for all
  using (
    exists (
      select 1
      from public.campaign_sessions s
      where s.id = campaign_session_attendance.session_id
        and public.is_campaign_dm(s.campaign_id)
    )
  )
  with check (
    exists (
      select 1
      from public.campaign_sessions s
      where s.id = campaign_session_attendance.session_id
        and public.is_campaign_dm(s.campaign_id)
    )
  );

drop policy if exists "members read attendance" on public.campaign_session_attendance;
create policy "members read attendance" on public.campaign_session_attendance
  for select
  using (
    exists (
      select 1
      from public.campaign_sessions s
      where s.id = campaign_session_attendance.session_id
        and public.is_campaign_member(s.campaign_id)
    )
  );

-- campaign_npcs: DM full + players read published
drop policy if exists "dm manages npcs" on public.campaign_npcs;
create policy "dm manages npcs" on public.campaign_npcs
  for all
  using (public.is_campaign_dm(campaign_id))
  with check (public.is_campaign_dm(campaign_id));

drop policy if exists "players read published npcs" on public.campaign_npcs;
create policy "players read published npcs" on public.campaign_npcs
  for select
  using (public.is_campaign_member(campaign_id) and published = true);

-- campaign_locations: DM full + players read published
drop policy if exists "dm manages locations" on public.campaign_locations;
create policy "dm manages locations" on public.campaign_locations
  for all
  using (public.is_campaign_dm(campaign_id))
  with check (public.is_campaign_dm(campaign_id));

drop policy if exists "players read published locations" on public.campaign_locations;
create policy "players read published locations" on public.campaign_locations
  for select
  using (public.is_campaign_member(campaign_id) and published = true);

-- campaign_quests: DM full + players read published
drop policy if exists "dm manages quests" on public.campaign_quests;
create policy "dm manages quests" on public.campaign_quests
  for all
  using (public.is_campaign_dm(campaign_id))
  with check (public.is_campaign_dm(campaign_id));

drop policy if exists "players read published quests" on public.campaign_quests;
create policy "players read published quests" on public.campaign_quests
  for select
  using (public.is_campaign_member(campaign_id) and published = true);

-- campaign_entity_links: DM full + members read
drop policy if exists "dm manages entity links" on public.campaign_entity_links;
create policy "dm manages entity links" on public.campaign_entity_links
  for all
  using (public.is_campaign_dm(campaign_id))
  with check (public.is_campaign_dm(campaign_id));

drop policy if exists "members read entity links" on public.campaign_entity_links;
create policy "members read entity links" on public.campaign_entity_links
  for select
  using (public.is_campaign_member(campaign_id));

-- campaign_handouts: DM full + players read published
drop policy if exists "dm manages handouts" on public.campaign_handouts;
create policy "dm manages handouts" on public.campaign_handouts
  for all
  using (public.is_campaign_dm(campaign_id))
  with check (public.is_campaign_dm(campaign_id));

drop policy if exists "players read published handouts" on public.campaign_handouts;
create policy "players read published handouts" on public.campaign_handouts
  for select
  using (public.is_campaign_member(campaign_id) and published = true);

-- campaign_assets: DM full + players read published
drop policy if exists "dm manages assets" on public.campaign_assets;
create policy "dm manages assets" on public.campaign_assets
  for all
  using (public.is_campaign_dm(campaign_id))
  with check (public.is_campaign_dm(campaign_id));

drop policy if exists "players read published assets" on public.campaign_assets;
create policy "players read published assets" on public.campaign_assets
  for select
  using (public.is_campaign_member(campaign_id) and published = true);

-- character_sheets: player manages own + DM reads visible only
drop policy if exists "player manages own sheet" on public.character_sheets;
create policy "player manages own sheet" on public.character_sheets
  for all
  using (auth.uid() = user_id and public.is_campaign_member(campaign_id))
  with check (auth.uid() = user_id);

drop policy if exists "dm reads sheets" on public.character_sheets;
create policy "dm reads sheets" on public.character_sheets
  for select
  using (public.is_campaign_dm(campaign_id) and visible_to_dm = true);
