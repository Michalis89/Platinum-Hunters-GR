-- Keep user_media_entries.updated_at tied to real user activity
-- and not metadata-only reorder operations (priority/pinned_rank).

CREATE OR REPLACE FUNCTION set_user_media_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If only metadata ordering fields changed, preserve the previous updated_at.
  IF NEW.user_id IS NOT DISTINCT FROM OLD.user_id
    AND NEW.media_id IS NOT DISTINCT FROM OLD.media_id
    AND NEW.status IS NOT DISTINCT FROM OLD.status
    AND NEW.progress IS NOT DISTINCT FROM OLD.progress
    AND NEW.score IS NOT DISTINCT FROM OLD.score
    AND NEW.notes IS NOT DISTINCT FROM OLD.notes
    AND NEW.selected_platform IS NOT DISTINCT FROM OLD.selected_platform
    AND NEW.is_favorite IS NOT DISTINCT FROM OLD.is_favorite
    AND NEW.import_source IS NOT DISTINCT FROM OLD.import_source
    AND NEW.created_at IS NOT DISTINCT FROM OLD.created_at
  THEN
    NEW.updated_at = OLD.updated_at;
    RETURN NEW;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_media_entries_updated ON user_media_entries;

CREATE TRIGGER trg_user_media_entries_updated
BEFORE UPDATE ON user_media_entries
FOR EACH ROW
EXECUTE FUNCTION set_user_media_entries_updated_at();
