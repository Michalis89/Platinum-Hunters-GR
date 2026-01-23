-- =====================================================
-- PLATINUM HUNTERS GR - MEDIA (ANIME/MANGA) CATALOG
-- =====================================================

CREATE TABLE media_items (
  id SERIAL PRIMARY KEY,
  mal_id INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('anime', 'manga')),
  source TEXT DEFAULT 'mal',

  title_english TEXT,
  title_romaji TEXT,
  title_native TEXT,
  description TEXT,
  format TEXT,
  status TEXT,
  season TEXT,
  season_year INTEGER,
  episodes INTEGER,
  duration INTEGER,
  chapters INTEGER,
  volumes INTEGER,
  start_date DATE,
  end_date DATE,

  cover_image_large TEXT,
  cover_image_medium TEXT,
  banner_image TEXT,

  genres TEXT[] DEFAULT '{}'::TEXT[],
  tags JSONB DEFAULT '[]'::JSONB,
  studios JSONB DEFAULT '[]'::JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX media_items_mal_category_uq ON media_items (mal_id, category);
CREATE INDEX media_items_category_idx ON media_items (category);
CREATE INDEX media_items_title_en_idx ON media_items (title_english);
CREATE INDEX media_items_title_romaji_idx ON media_items (title_romaji);
CREATE INDEX media_items_title_native_idx ON media_items (title_native);

CREATE TABLE user_media_entries (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  media_id INTEGER REFERENCES media_items(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned', 'current', 'completed')),
  score DECIMAL(3,1),
  progress INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, media_id)
);

CREATE INDEX user_media_entries_user_idx ON user_media_entries (user_id);
CREATE INDEX user_media_entries_media_idx ON user_media_entries (media_id);
