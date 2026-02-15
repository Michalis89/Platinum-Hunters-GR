UPDATE public.media_items
SET source = 'igdb'
WHERE category = 'games'
  AND igdb_id IS NOT NULL
  AND COALESCE(source, '') <> 'igdb';
