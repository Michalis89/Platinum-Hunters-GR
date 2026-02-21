-- =====================================================
-- HOBBISTAS HUB - DATABASE MIGRATION
-- Part 61: Ensure diary key salts table exists
-- =====================================================

create table if not exists public.diary_key_salts (
  user_id uuid primary key references public.users(id) on delete cascade,
  salt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.diary_key_salts enable row level security;

-- Keep policies idempotent even when a prior migration already created different names.
drop policy if exists "Users can read own diary key salt" on public.diary_key_salts;
drop policy if exists "Users can insert own diary key salt" on public.diary_key_salts;
drop policy if exists "Users can update own diary key salt" on public.diary_key_salts;
drop policy if exists "Users can delete own diary key salt" on public.diary_key_salts;

create policy "Users can read own diary key salt"
  on public.diary_key_salts
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own diary key salt"
  on public.diary_key_salts
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own diary key salt"
  on public.diary_key_salts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own diary key salt"
  on public.diary_key_salts
  for delete
  using (auth.uid() = user_id);

drop trigger if exists trigger_update_diary_key_salts_updated_at on public.diary_key_salts;
create trigger trigger_update_diary_key_salts_updated_at
  before update on public.diary_key_salts
  for each row
  execute function update_updated_at_column();
