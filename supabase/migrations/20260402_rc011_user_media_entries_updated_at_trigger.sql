-- RC-011: ensure user_media_entries.updated_at is always maintained for optimistic locking.

ALTER TABLE public.user_media_entries
ADD COLUMN IF NOT EXISTS updated_at timestamptz;

UPDATE public.user_media_entries
SET updated_at = COALESCE(updated_at, now())
WHERE updated_at IS NULL;

ALTER TABLE public.user_media_entries
ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.user_media_entries
ALTER COLUMN updated_at SET NOT NULL;

CREATE OR REPLACE FUNCTION public.set_user_media_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_media_entries_updated_at ON public.user_media_entries;

CREATE TRIGGER trg_user_media_entries_updated_at
BEFORE UPDATE ON public.user_media_entries
FOR EACH ROW
EXECUTE FUNCTION public.set_user_media_entries_updated_at();
