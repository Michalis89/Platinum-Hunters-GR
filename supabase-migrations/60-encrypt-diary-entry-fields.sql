-- =====================================================
-- HOBBISTAS HUB - DATABASE MIGRATION
-- Part 60: Encrypted diary fields + passphrase salt metadata
-- =====================================================

ALTER TABLE diary_entries
  ADD COLUMN IF NOT EXISTS content_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS iv TEXT,
  ADD COLUMN IF NOT EXISTS title_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS title_iv TEXT;

-- Keep plaintext columns for legacy rows, but remove strict NOT NULL to allow encrypted-only writes.
ALTER TABLE diary_entries
  ALTER COLUMN title DROP NOT NULL,
  ALTER COLUMN content DROP NOT NULL;

CREATE TABLE IF NOT EXISTS diary_key_salts (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  salt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE diary_key_salts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read their own diary key salt"
  ON diary_key_salts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own diary key salt"
  ON diary_key_salts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own diary key salt"
  ON diary_key_salts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own diary key salt"
  ON diary_key_salts
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION enforce_diary_entries_encrypted_write()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.title_encrypted IS NULL OR NEW.title_iv IS NULL OR NEW.content_encrypted IS NULL OR NEW.iv IS NULL THEN
    RAISE EXCEPTION 'Diary entries must include encrypted title/content fields';
  END IF;

  IF COALESCE(NEW.title, '') <> '' OR COALESCE(NEW.content, '') <> '' THEN
    RAISE EXCEPTION 'Plaintext title/content writes are not allowed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_diary_entries_encrypted_write ON diary_entries;
CREATE TRIGGER trigger_enforce_diary_entries_encrypted_write
  BEFORE INSERT OR UPDATE ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION enforce_diary_entries_encrypted_write();

CREATE TRIGGER trigger_update_diary_key_salts_updated_at
  BEFORE UPDATE ON diary_key_salts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_diary_entries_user_date ON diary_entries (user_id, entry_date DESC);

DO $$
BEGIN
  RAISE NOTICE 'Diary encrypted fields and key salt metadata enforced';
END $$;
