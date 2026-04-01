-- Add optional expiry timestamp for share links
-- NULL means the token never expires

ALTER TABLE public.share_tokens
ADD COLUMN IF NOT EXISTS expires_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_share_tokens_expires_at
ON public.share_tokens (expires_at);
