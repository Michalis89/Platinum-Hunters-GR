-- RC-012: enforce unique slugs for article creation.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'articles_slug_unique'
  ) THEN
    ALTER TABLE public.articles
      ADD CONSTRAINT articles_slug_unique UNIQUE (slug);
  END IF;
END
$$;
