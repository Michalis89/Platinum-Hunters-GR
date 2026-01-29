CREATE INDEX IF NOT EXISTS ume_user_status_updated_idx
ON user_media_entries (user_id, status, updated_at DESC, created_at DESC);
