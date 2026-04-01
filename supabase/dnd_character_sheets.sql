create table if not exists public.character_sheets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  character_name text not null,
  race text,
  class text,
  subclass text,
  level int not null default 1 check (level between 1 and 20),
  background text,
  alignment text,
  str int check (str between 1 and 30),
  dex int check (dex between 1 and 30),
  con int check (con between 1 and 30),
  int_stat int check (int_stat between 1 and 30),
  wis int check (wis between 1 and 30),
  cha int check (cha between 1 and 30),
  hp_max int,
  hp_current int,
  hp_temp int default 0,
  ac int,
  speed int default 30,
  initiative_bonus int default 0,
  proficiency_bonus int default 2,
  features text,
  equipment text,
  spells text,
  notes text,
  visible_to_dm boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, user_id)
);

create index if not exists idx_character_sheets_campaign_id on public.character_sheets(campaign_id);
create index if not exists idx_character_sheets_user_id on public.character_sheets(user_id);

