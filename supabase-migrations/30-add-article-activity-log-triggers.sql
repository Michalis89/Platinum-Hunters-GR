-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 30: Article Likes/Comments Activity Log Helpers
-- =====================================================

-- Ensure log helpers exist (safe to re-run)
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

-- Attach log helpers to likes/comments
DROP TRIGGER IF EXISTS trigger_log_article_like_activity ON article_likes;
CREATE TRIGGER trigger_log_article_like_activity
  AFTER INSERT OR DELETE ON article_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_article_like_activity();

DROP TRIGGER IF EXISTS trigger_log_article_comment_activity ON article_comments;
CREATE TRIGGER trigger_log_article_comment_activity
  AFTER INSERT OR DELETE ON article_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_article_comment_activity();

DO $$
BEGIN
  RAISE NOTICE '✅ Article likes/comments log triggers refreshed.';
END $$;
