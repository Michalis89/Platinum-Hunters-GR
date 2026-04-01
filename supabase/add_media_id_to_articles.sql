-- Add media_id foreign key to articles table
-- Links an article/review to a specific media item

ALTER TABLE articles ADD COLUMN IF NOT EXISTS media_id integer REFERENCES media_items(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_articles_media_id ON articles(media_id);
