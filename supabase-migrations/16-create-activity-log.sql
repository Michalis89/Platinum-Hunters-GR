-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 16: Create Activity Log Table
-- =====================================================

-- Activity log for user actions (backlog changes, guide updates, etc)
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Activity type (e.g., 'backlog_status', 'guide_created', 'guide_updated')
  type TEXT NOT NULL,

  -- Activity payload (JSONB for flexibility)
  payload JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);

-- Index for type queries
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(type);

-- Index for created_at (for sorting)
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- RLS Policies
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own activity
CREATE POLICY "Users can read their own activity"
  ON activity_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read all activity (for global feed)
CREATE POLICY "Users can read all activity"
  ON activity_log
  FOR SELECT
  USING (true);

-- Users can insert their own activity
CREATE POLICY "Users can insert their own activity"
  ON activity_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Helper for logging article likes
CREATE OR REPLACE FUNCTION public.log_article_like_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_log (user_id, type, payload)
    VALUES (
      NEW.user_id,
      'article_liked',
      jsonb_build_object('article_id', NEW.article_id)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_log (user_id, type, payload)
    VALUES (
      OLD.user_id,
      'article_unliked',
      jsonb_build_object('article_id', OLD.article_id)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Helper for logging article comments
CREATE OR REPLACE FUNCTION public.log_article_comment_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_log (user_id, type, payload)
    VALUES (
      NEW.user_id,
      'article_commented',
      jsonb_build_object('article_id', NEW.article_id, 'comment_id', NEW.id)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_log (user_id, type, payload)
    VALUES (
      OLD.user_id,
      'article_comment_deleted',
      jsonb_build_object('article_id', OLD.article_id, 'comment_id', OLD.id)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Activity log table created successfully!';
END $$;
