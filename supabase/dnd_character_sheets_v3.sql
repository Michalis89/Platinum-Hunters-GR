-- Comprehensive D&D 5e character sheet expansion

ALTER TABLE public.character_sheets
  -- Skills proficiency & expertise (comma-separated keys, e.g. "athletics,arcana")
  ADD COLUMN IF NOT EXISTS skills_profs     text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS skills_expertise text NOT NULL DEFAULT '',

  -- Inspiration flag
  ADD COLUMN IF NOT EXISTS inspiration boolean NOT NULL DEFAULT false,

  -- Death saves
  ADD COLUMN IF NOT EXISTS death_save_successes int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS death_save_failures  int NOT NULL DEFAULT 0,

  -- Hit dice
  ADD COLUMN IF NOT EXISTS hit_dice_type  text NOT NULL DEFAULT 'd8',
  ADD COLUMN IF NOT EXISTS hit_dice_spent int  NOT NULL DEFAULT 0,

  -- Passive perception (stored for quick display; auto = 10 + WIS mod + any bonuses)
  ADD COLUMN IF NOT EXISTS passive_perception int,

  -- Weapons table (JSON array of {name, attack_bonus, damage, damage_type, range, notes})
  ADD COLUMN IF NOT EXISTS weapons_data jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Character backstory & personality
  ADD COLUMN IF NOT EXISTS languages         text,
  ADD COLUMN IF NOT EXISTS personality_traits text,
  ADD COLUMN IF NOT EXISTS ideals            text,
  ADD COLUMN IF NOT EXISTS bonds             text,
  ADD COLUMN IF NOT EXISTS flaws             text,
  ADD COLUMN IF NOT EXISTS appearance        text,
  ADD COLUMN IF NOT EXISTS backstory         text,

  -- Spellcasting
  ADD COLUMN IF NOT EXISTS spellcasting_ability text,
  ADD COLUMN IF NOT EXISTS spell_save_dc        int,
  ADD COLUMN IF NOT EXISTS spell_attack_bonus   int,
  ADD COLUMN IF NOT EXISTS spell_slots_max  jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS spell_slots_used jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS spells_cantrips  text,
  ADD COLUMN IF NOT EXISTS spells_1         text,
  ADD COLUMN IF NOT EXISTS spells_2         text,
  ADD COLUMN IF NOT EXISTS spells_3         text,
  ADD COLUMN IF NOT EXISTS spells_4         text,
  ADD COLUMN IF NOT EXISTS spells_5         text,
  ADD COLUMN IF NOT EXISTS spells_6         text,
  ADD COLUMN IF NOT EXISTS spells_7         text,
  ADD COLUMN IF NOT EXISTS spells_8         text,
  ADD COLUMN IF NOT EXISTS spells_9         text,

  -- Extra resource (Sorcery Points / Ki / etc.)
  ADD COLUMN IF NOT EXISTS extra_resource_name text,
  ADD COLUMN IF NOT EXISTS extra_resource_max  int,
  ADD COLUMN IF NOT EXISTS extra_resource_used int NOT NULL DEFAULT 0;
