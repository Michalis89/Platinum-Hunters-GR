-- Remove the unique constraint so players can have multiple sheets per campaign
alter table public.character_sheets
  drop constraint if exists character_sheets_campaign_id_user_id_key;

-- DM private notes on a character sheet (not visible to the player)
alter table public.character_sheets
  add column if not exists dm_notes text;

-- Saving throw proficiencies stored as comma-separated stat keys, e.g. "str,dex,con"
alter table public.character_sheets
  add column if not exists saving_throw_profs text not null default '';
