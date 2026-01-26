-- Migration: Create article_likes and article_comments tables
-- This allows tracking who liked/commented on articles and enables activity logging

-- Article Likes Table
CREATE TABLE IF NOT EXISTS article_likes (
  id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- Article Comments Table
CREATE TABLE IF NOT EXISTS article_comments (
  id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_article_likes_article_id ON article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_user_id ON article_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_user_id ON article_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_created_at ON article_comments(created_at DESC);

-- RLS Policies for article_likes
ALTER TABLE article_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all article likes"
  ON article_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own likes"
  ON article_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON article_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for article_comments
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all article comments"
  ON article_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own comments"
  ON article_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON article_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON article_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update articles.likes count when a like is added/removed
CREATE OR REPLACE FUNCTION update_article_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE articles SET likes = likes + 1 WHERE id = NEW.article_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE articles SET likes = GREATEST(likes - 1, 0) WHERE id = OLD.article_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update likes count
DROP TRIGGER IF EXISTS trigger_update_article_likes_count ON article_likes;
CREATE TRIGGER trigger_update_article_likes_count
  AFTER INSERT OR DELETE ON article_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_article_likes_count();
