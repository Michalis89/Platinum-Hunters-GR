-- RC-030: make comment creation idempotent for retried POST requests.

ALTER TABLE public.article_comments
ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS article_comments_article_user_idempotency_key_idx
ON public.article_comments (article_id, user_id, idempotency_key)
WHERE idempotency_key IS NOT NULL;
