-- Genre Affinity Table
-- Caches computed genre affinity scores per user per category.
-- Run this in the Supabase SQL Editor or as a migration.

CREATE TABLE IF NOT EXISTS user_genre_affinity (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  genre TEXT NOT NULL,
  score NUMERIC(6,2) NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 0,
  strong_signal_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, genre)
);

-- Row-level security
ALTER TABLE user_genre_affinity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own genre affinity"
  ON user_genre_affinity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own genre affinity"
  ON user_genre_affinity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own genre affinity"
  ON user_genre_affinity FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own genre affinity"
  ON user_genre_affinity FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_genre_affinity_user_cat
  ON user_genre_affinity(user_id, category);
