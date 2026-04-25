-- RC-050: deduplicate user_media_entries and enforce unique (user_id, media_id).
-- Duplicate rows cause .maybeSingle() to return null in the library PATCH handler,
-- producing false-positive 409 conflicts when editing entries like Superman.

-- Keep the most-recently-created row for each (user_id, media_id) pair.
DELETE FROM public.user_media_entries a
USING public.user_media_entries b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.media_id = b.media_id;

-- Add the unique constraint so future upserts work correctly.
ALTER TABLE public.user_media_entries
ADD CONSTRAINT uq_user_media_entries_user_media UNIQUE (user_id, media_id);
