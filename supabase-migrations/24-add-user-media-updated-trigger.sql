CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_media_entries_updated ON user_media_entries;

CREATE TRIGGER trg_user_media_entries_updated
BEFORE UPDATE ON user_media_entries
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
