-- =====================================================
-- USER GAME PLATFORM + SOURCE DATA FIX
-- =====================================================

ALTER TABLE public.user_media_entries
  ADD COLUMN IF NOT EXISTS selected_platform TEXT;

-- Fix bad legacy import_source values on games that were mislabeled as MAL.
UPDATE public.user_media_entries AS ume
SET import_source = CASE
  WHEN mi.steam_app_id IS NOT NULL THEN 'steam'
  WHEN mi.rawg_id IS NOT NULL THEN 'rawg'
  WHEN mi.source IN ('steam', 'rawg') THEN mi.source
  ELSE NULL
END
FROM public.media_items AS mi
WHERE ume.media_id = mi.id
  AND mi.category = 'games'
  AND ume.import_source = 'mal';
