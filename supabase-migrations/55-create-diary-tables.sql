-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 55: Create Diary Tables (100% Private)
-- =====================================================

CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT CHECK (mood IN ('happy', 'sad', 'neutral', 'excited', 'anxious', 'calm', 'frustrated')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Metadata
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Performance: index for user queries
  CONSTRAINT diary_entries_unique_user_date UNIQUE (user_id, id)
);

-- Index for fast user lookups sorted by date
CREATE INDEX idx_diary_entries_user_date ON diary_entries (user_id, entry_date DESC);

-- Enable RLS
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- RLS: USER-ONLY ACCESS (100% PRIVATE - even admins cannot read)
CREATE POLICY "Users can only read their own diary entries"
  ON diary_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own diary entries"
  ON diary_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own diary entries"
  ON diary_entries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own diary entries"
  ON diary_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger: update updated_at
CREATE TRIGGER trigger_update_diary_entries_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Diary tables created with strict user-only RLS policies';
END $$;
