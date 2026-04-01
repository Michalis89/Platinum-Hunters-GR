-- Share Tokens table
-- One token per user, used for read-only invite URLs: /share/{token}
-- Token bypasses privacy settings so private profiles can share their library

CREATE TABLE IF NOT EXISTS public.share_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token   text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read and manage their own token
CREATE POLICY "Users can manage own share token"
  ON public.share_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role (used in API routes via getSupabaseServer) bypasses RLS automatically.
-- No additional policy is needed for public token resolution.
