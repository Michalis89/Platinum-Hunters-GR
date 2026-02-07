-- =====================================================
-- STEAM LIBRARY SYNC SUPPORT
-- =====================================================

ALTER TABLE public.media_items
  ADD COLUMN IF NOT EXISTS steam_app_id INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS media_items_steam_app_category_uq
  ON public.media_items (steam_app_id, category)
  WHERE steam_app_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS media_items_steam_app_id_idx
  ON public.media_items (steam_app_id)
  WHERE steam_app_id IS NOT NULL;

ALTER TABLE public.user_media_entries
  ADD COLUMN IF NOT EXISTS import_source TEXT;

ALTER TABLE public.user_media_entries
  DROP CONSTRAINT IF EXISTS user_media_entries_import_source_check;

ALTER TABLE public.user_media_entries
  ADD CONSTRAINT user_media_entries_import_source_check
  CHECK (
    import_source IS NULL
    OR import_source IN ('mal', 'steam', 'rawg', 'tmdb', 'google_books', 'manual')
  );

UPDATE public.user_media_entries AS ume
SET import_source = 'mal'
FROM public.media_items AS mi
WHERE ume.media_id = mi.id
  AND ume.import_source IS NULL
  AND mi.source = 'mal';
