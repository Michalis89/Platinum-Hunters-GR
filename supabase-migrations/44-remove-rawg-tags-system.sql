DO $$
BEGIN
  IF to_regclass('public.tag_definitions') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trigger_update_tag_definitions_updated_at ON public.tag_definitions';
  END IF;
END
$$;

DROP TABLE IF EXISTS public.media_item_tag_links;
DROP TABLE IF EXISTS public.tag_definitions;

UPDATE public.media_items
SET tags = NULL
WHERE category = 'games';
