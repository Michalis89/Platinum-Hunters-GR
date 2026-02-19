-- Restrict pin reordering to completed favorites only.
-- This prevents metadata reordering from touching in-progress entries.

CREATE OR REPLACE FUNCTION public.reorder_pins(
  p_user_id UUID,
  p_category TEXT,
  p_order JSONB
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  entry_ids INT[] := ARRAY(
    SELECT (value)::INT
    FROM jsonb_array_elements(p_order) AS entries(value)
  );
  len INT := COALESCE(array_length(entry_ids, 1), 0);
  unique_ids INT;
  valid_count INT;
BEGIN
  IF len > 5 THEN
    RAISE EXCEPTION 'Pinned list cannot contain more than 5 entries';
  END IF;

  SELECT COUNT(DISTINCT entry) INTO unique_ids
  FROM unnest(entry_ids) AS entry;

  IF unique_ids <> len THEN
    RAISE EXCEPTION 'Pinned order contains duplicates';
  END IF;

  IF len = 0 THEN
    UPDATE public.user_media_entries ume
    SET pinned_rank = NULL
    FROM public.media_items mi
    WHERE ume.media_id = mi.id
      AND ume.user_id = p_user_id
      AND LOWER(mi.category) = LOWER(p_category)
      AND ume.status = 'completed'
      AND COALESCE(ume.is_favorite, FALSE) = TRUE;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO valid_count
  FROM public.user_media_entries ume
  JOIN public.media_items mi ON mi.id = ume.media_id
  WHERE ume.user_id = p_user_id
    AND LOWER(mi.category) = LOWER(p_category)
    AND ume.id = ANY(entry_ids)
    AND ume.status = 'completed'
    AND COALESCE(ume.is_favorite, FALSE) = TRUE;

  IF valid_count <> len THEN
    RAISE EXCEPTION 'Invalid entries included in the pinned order';
  END IF;

  UPDATE public.user_media_entries ume
  SET pinned_rank = NULL
  FROM public.media_items mi
  WHERE ume.media_id = mi.id
    AND ume.user_id = p_user_id
    AND LOWER(mi.category) = LOWER(p_category)
    AND ume.status = 'completed'
    AND COALESCE(ume.is_favorite, FALSE) = TRUE;

  FOR i IN 1..len LOOP
    UPDATE public.user_media_entries
    SET pinned_rank = i
    WHERE id = entry_ids[i]
      AND status = 'completed'
      AND COALESCE(is_favorite, FALSE) = TRUE;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.reorder_pins IS 'Reorders up to five completed favorite entries for a user/category.';
