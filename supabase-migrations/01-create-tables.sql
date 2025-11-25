-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 1: Create Tables
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- REFERENCE TABLES
-- =====================================================

-- Platforms (PS4, PS5, etc)
CREATE TABLE platforms (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  short_name TEXT UNIQUE NOT NULL,
  icon_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Genres
CREATE TABLE genres (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Developers
CREATE TABLE developers (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Publishers
CREATE TABLE publishers (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- USER TABLE
-- =====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),

  -- Cached stats
  total_games_completed INTEGER DEFAULT 0,
  total_hours_played DECIMAL(10,2) DEFAULT 0,
  total_platinums INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- GAMES TABLE
-- =====================================================

CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Images
  cover_image TEXT,
  background_image TEXT,

  -- Trophy Counts
  trophy_platinum INTEGER DEFAULT 0,
  trophy_gold INTEGER DEFAULT 0,
  trophy_silver INTEGER DEFAULT 0,
  trophy_bronze INTEGER DEFAULT 0,
  trophy_total INTEGER GENERATED ALWAYS AS (trophy_platinum + trophy_gold + trophy_silver + trophy_bronze) STORED,

  -- Metadata
  release_date DATE,
  release_year INTEGER,

  -- Foreign Keys
  developer_id INTEGER REFERENCES developers(id) ON DELETE SET NULL,
  publisher_id INTEGER REFERENCES publishers(id) ON DELETE SET NULL,

  -- External IDs
  psn_trophy_id TEXT UNIQUE,
  rawg_id INTEGER,

  -- Ratings
  metacritic_score INTEGER CHECK (metacritic_score >= 0 AND metacritic_score <= 100),
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),

  -- Cached stats
  total_guides INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  average_difficulty DECIMAL(3,2),
  average_hours DECIMAL(6,2),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Full-text search support
ALTER TABLE games ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED;

-- =====================================================
-- GAME RELATIONSHIPS (Many-to-Many)
-- =====================================================

-- Game can be on multiple platforms
CREATE TABLE game_platforms (
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, platform_id)
);

-- Game can have multiple genres
CREATE TABLE game_genres (
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, genre_id)
);

-- =====================================================
-- TROPHIES TABLE
-- =====================================================

CREATE TABLE trophies (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('Bronze', 'Silver', 'Gold', 'Platinum')),

  -- Optional metadata
  icon_url TEXT,
  is_hidden BOOLEAN DEFAULT FALSE,
  rarity_percentage DECIMAL(5,2),

  -- External ID
  psn_trophy_id TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- GUIDES TABLES
-- =====================================================

-- Main guide info
CREATE TABLE guides (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE NOT NULL,

  -- Guide Info
  title TEXT NOT NULL,
  description TEXT,

  -- Difficulty Info
  difficulty TEXT CHECK (difficulty IN ('Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard')),
  difficulty_rating DECIMAL(3,2) CHECK (difficulty_rating >= 1 AND difficulty_rating <= 10),

  -- Time Info
  estimated_hours DECIMAL(6,2),
  estimated_playthroughs INTEGER DEFAULT 1,

  -- Author
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_verified BOOLEAN DEFAULT FALSE,

  -- Stats
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Guide steps (normalized, not JSON)
CREATE TABLE guide_steps (
  id SERIAL PRIMARY KEY,
  guide_id INTEGER REFERENCES guides(id) ON DELETE CASCADE NOT NULL,

  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(guide_id, step_number)
);

-- Link steps to trophies
CREATE TABLE guide_step_trophies (
  step_id INTEGER REFERENCES guide_steps(id) ON DELETE CASCADE,
  trophy_id INTEGER REFERENCES trophies(id) ON DELETE CASCADE,
  PRIMARY KEY (step_id, trophy_id)
);

-- =====================================================
-- USER BACKLOG & COMPLETED GAMES
-- =====================================================

-- User's backlog (games to play)
CREATE TABLE user_backlog (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE NOT NULL,

  -- Priority
  priority INTEGER DEFAULT 0,

  -- Notes
  notes TEXT,

  -- Dates
  added_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, game_id)
);

-- Completed games with reviews
CREATE TABLE user_completed_games (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE NOT NULL,

  -- Completion Info
  completed_at TIMESTAMP DEFAULT NOW(),
  actual_hours DECIMAL(6,2),
  actual_playthroughs INTEGER,

  -- Review
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  would_recommend BOOLEAN,
  review_text TEXT,

  -- Platinum
  got_platinum BOOLEAN DEFAULT FALSE,
  platinum_date TIMESTAMP,

  -- Difficulty (personal opinion)
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 10),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, game_id)
);

-- =====================================================
-- SOCIAL FEATURES
-- =====================================================

-- Comments system
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Polymorphic (can be comment on guide or review)
  commentable_type TEXT NOT NULL CHECK (commentable_type IN ('guide', 'review', 'comment')),
  commentable_id INTEGER NOT NULL,

  content TEXT NOT NULL,

  -- Nested comments (replies)
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,

  -- Moderation
  is_approved BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User likes on guides
CREATE TABLE user_guide_likes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  guide_id INTEGER REFERENCES guides(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, guide_id)
);

-- =====================================================
-- ADMIN
-- =====================================================

-- Admin action logs
CREATE TABLE admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,

  action TEXT NOT NULL,
  target_type TEXT,
  target_id INTEGER,

  details JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All tables created successfully!';
END $$;
