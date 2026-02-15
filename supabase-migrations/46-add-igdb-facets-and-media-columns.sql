ALTER TABLE public.media_items
  ADD COLUMN IF NOT EXISTS igdb_themes TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS igdb_game_modes TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS igdb_player_perspectives TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS igdb_artwork_image_ids TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS igdb_screenshot_image_ids TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS official_website TEXT;

CREATE INDEX IF NOT EXISTS media_items_igdb_themes_gin_idx
  ON public.media_items USING GIN (igdb_themes);

CREATE INDEX IF NOT EXISTS media_items_igdb_game_modes_gin_idx
  ON public.media_items USING GIN (igdb_game_modes);

CREATE INDEX IF NOT EXISTS media_items_igdb_player_perspectives_gin_idx
  ON public.media_items USING GIN (igdb_player_perspectives);
