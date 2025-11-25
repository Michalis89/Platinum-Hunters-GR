# Platinum Hunters GR - Database Design

## 🎯 Overview
Comprehensive database schema for a PlayStation trophy hunting platform with user tracking, backlog management, and social features.

---

## 📋 TABLES STRUCTURE

### 1. **users** - User Accounts
**Σκοπός:** Αποθηκεύει user accounts. Το Supabase έχει built-in auth.users table, αλλά φτιάχνουμε το δικό μας για extra info.

```sql
users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Stats
  total_games_completed INTEGER DEFAULT 0,
  total_hours_played INTEGER DEFAULT 0,
  total_platinums INTEGER DEFAULT 0
)
```

**Εξήγηση:**
- `UUID` = Unique identifier (safer than integers)
- `role` = User permissions (user/moderator/admin)
- Stats = Cached values για γρήγορο retrieval (θα τα update με triggers)

---

### 2. **platforms** - Gaming Platforms
**Σκοπός:** Reference table για platforms (PS4, PS5, PS Vita, κτλ)

```sql
platforms (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,        -- 'PlayStation 4', 'PlayStation 5'
  short_name TEXT UNIQUE NOT NULL,  -- 'PS4', 'PS5'
  icon_name TEXT,                   -- For UI icons
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Γιατί separate table:**
- Consistency (όλοι γράφουν "PS4" το ίδιο)
- Easy to add new platforms
- Can query "all PS5 games"

---

### 3. **genres** - Game Genres
**Σκοπός:** Reference table για game genres

```sql
genres (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,        -- 'Action', 'RPG', 'Adventure'
  slug TEXT UNIQUE NOT NULL,        -- 'action', 'rpg', 'adventure'
  created_at TIMESTAMP DEFAULT NOW()
)
```

---

### 4. **developers** - Game Developers
**Σκοπός:** Reference table για developers

```sql
developers (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)
```

---

### 5. **publishers** - Game Publishers
**Σκοπός:** Reference table για publishers

```sql
publishers (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)
```

---

### 6. **games** - Core Game Information
**Σκοπός:** Αποθηκεύει όλες τις βασικές πληροφορίες για τα games

```sql
games (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Images
  cover_image TEXT,
  background_image TEXT,

  -- Trophy Counts (from PSN)
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
  psn_trophy_id TEXT UNIQUE,        -- PSN API ID
  rawg_id INTEGER,                  -- RAWG API ID

  -- Ratings
  metacritic_score INTEGER CHECK (metacritic_score >= 0 AND metacritic_score <= 100),
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),

  -- Stats (cached)
  total_guides INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  average_difficulty DECIMAL(3,2),
  average_hours DECIMAL(6,2),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('greek', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED
)
```

**Εξήγηση σημαντικών πεδίων:**
- `slug` = URL-friendly identifier ("god-of-war-ragnarok")
- `GENERATED ALWAYS AS` = Auto-calculated field (trophy_total)
- `ON DELETE SET NULL` = Αν διαγραφεί developer, το game μένει αλλά χωρίς developer
- `search_vector` = Full-text search support για γρήγορο search

---

### 7. **game_platforms** - Many-to-Many Relationship
**Σκοπός:** Ένα game μπορεί να είναι σε πολλά platforms (PS4 + PS5)

```sql
game_platforms (
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, platform_id)
)
```

**Γιατί separate table:**
- A game can be on multiple platforms
- A platform has multiple games
- = Many-to-Many relationship

---

### 8. **game_genres** - Many-to-Many Relationship
**Σκοπός:** Ένα game μπορεί να έχει πολλά genres

```sql
game_genres (
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, genre_id)
)
```

---

### 9. **guides** - Trophy Guides
**Σκοπός:** Trophy guides για κάθε game (ένα game μπορεί να έχει πολλά guides)

```sql
guides (
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
  is_verified BOOLEAN DEFAULT FALSE,  -- Admin verified

  -- Stats
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
)
```

**Εξήγηση:**
- `author_id` = Ποιος έγραψε το guide (για future user-generated content)
- `status` = Draft/Published (για admin approval)
- `is_verified` = Admin-approved guide

---

### 10. **guide_steps** - Trophy Guide Steps
**Σκοπός:** Τα steps ενός guide (normalized, όχι JSON blob)

```sql
guide_steps (
  id SERIAL PRIMARY KEY,
  guide_id INTEGER REFERENCES guides(id) ON DELETE CASCADE NOT NULL,

  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Optional: Link to specific trophies
  -- (θα φτιάξουμε separate table για trophy-step mapping)

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(guide_id, step_number)
)
```

**Γιατί separate table:**
- Μπορείς να κάνεις queries σε specific steps
- Μπορείς να προσθέσεις comments σε κάθε step
- Better structure than JSON blob

---

### 11. **trophies** - Individual Trophies
**Σκοπός:** Τα individual trophies για κάθε game

```sql
trophies (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('Bronze', 'Silver', 'Gold', 'Platinum')),

  -- Optional metadata
  icon_url TEXT,
  is_hidden BOOLEAN DEFAULT FALSE,
  rarity_percentage DECIMAL(5,2),  -- % of players who earned it

  -- External ID
  psn_trophy_id TEXT,

  created_at TIMESTAMP DEFAULT NOW()
)
```

---

### 12. **guide_step_trophies** - Link Steps to Trophies
**Σκοπός:** Many-to-Many: Ένα step μπορεί να αφορά πολλά trophies

```sql
guide_step_trophies (
  step_id INTEGER REFERENCES guide_steps(id) ON DELETE CASCADE,
  trophy_id INTEGER REFERENCES trophies(id) ON DELETE CASCADE,
  PRIMARY KEY (step_id, trophy_id)
)
```

---

### 13. **user_backlog** - User's Backlog
**Σκοπός:** Games που ο user θέλει να παίξει

```sql
user_backlog (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE NOT NULL,

  -- Priority
  priority INTEGER DEFAULT 0,  -- For sorting

  -- Notes
  notes TEXT,

  -- Dates
  added_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, game_id)
)
```

**Εξήγηση:**
- `UNIQUE(user_id, game_id)` = User δεν μπορεί να προσθέσει το ίδιο game 2 φορές
- `priority` = User μπορεί να ορίσει προτεραιότητα

---

### 14. **user_completed_games** - Completed Games + Reviews
**Σκοπός:** Games που ο user έχει ολοκληρώσει με review

```sql
user_completed_games (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE NOT NULL,

  -- Completion Info
  completed_at TIMESTAMP DEFAULT NOW(),
  actual_hours DECIMAL(6,2),        -- Πόσο χρόνο πήρε πραγματικά
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
)
```

**Αυτό είναι το core του backlog system:**
- User completes game → moves from backlog to completed
- Adds review, rating, time spent
- Can compare estimated vs actual time

---

### 15. **comments** - Comments System
**Σκοπός:** Comments σε guides, reviews, etc

```sql
comments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Polymorphic (μπορεί να είναι comment σε guide ή σε review)
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
)
```

---

### 16. **user_guide_likes** - User Likes on Guides
**Σκοπός:** Track ποιος user έκανε like ποιο guide

```sql
user_guide_likes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  guide_id INTEGER REFERENCES guides(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, guide_id)
)
```

---

### 17. **admin_logs** - Admin Action Logs
**Σκοπός:** Audit trail για admin actions

```sql
admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,

  action TEXT NOT NULL,             -- 'approved_guide', 'deleted_comment', etc
  target_type TEXT,                 -- 'guide', 'user', 'comment'
  target_id INTEGER,

  details JSONB,                    -- Extra info

  created_at TIMESTAMP DEFAULT NOW()
)
```

---

## 🔍 INDEXES για Performance

```sql
-- Games
CREATE INDEX idx_games_slug ON games(slug);
CREATE INDEX idx_games_release_year ON games(release_year);
CREATE INDEX idx_games_developer ON games(developer_id);
CREATE INDEX idx_games_search ON games USING GIN(search_vector);

-- Guides
CREATE INDEX idx_guides_game ON guides(game_id);
CREATE INDEX idx_guides_author ON guides(author_id);
CREATE INDEX idx_guides_status ON guides(status);

-- User Backlog
CREATE INDEX idx_backlog_user ON user_backlog(user_id);
CREATE INDEX idx_backlog_game ON user_backlog(game_id);

-- Completed Games
CREATE INDEX idx_completed_user ON user_completed_games(user_id);
CREATE INDEX idx_completed_game ON user_completed_games(game_id);
CREATE INDEX idx_completed_platinum ON user_completed_games(got_platinum) WHERE got_platinum = TRUE;

-- Comments
CREATE INDEX idx_comments_target ON comments(commentable_type, commentable_id);
CREATE INDEX idx_comments_user ON comments(user_id);
```

---

## 🔐 ROW LEVEL SECURITY (RLS) Policies

Supabase χρησιμοποιεί Row Level Security για να προστατεύσει data.

### Examples:

```sql
-- Users can only read their own backlog
CREATE POLICY "Users can view own backlog"
  ON user_backlog FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert to their own backlog
CREATE POLICY "Users can add to own backlog"
  ON user_backlog FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Anyone can read published guides
CREATE POLICY "Anyone can view published guides"
  ON guides FOR SELECT
  USING (status = 'published');

-- Only admins can approve guides
CREATE POLICY "Admins can update guides"
  ON guides FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );
```

---

## 📊 VIEWS για Common Queries

### View: Full Game Data (με joins)
```sql
CREATE VIEW full_game_data AS
SELECT
  g.*,
  d.name as developer_name,
  p.name as publisher_name,
  array_agg(DISTINCT pl.short_name) as platforms,
  array_agg(DISTINCT gen.name) as genres,
  COUNT(DISTINCT gu.id) as guide_count
FROM games g
LEFT JOIN developers d ON g.developer_id = d.id
LEFT JOIN publishers p ON g.publisher_id = p.id
LEFT JOIN game_platforms gp ON g.id = gp.game_id
LEFT JOIN platforms pl ON gp.platform_id = pl.id
LEFT JOIN game_genres gg ON g.id = gg.game_id
LEFT JOIN genres gen ON gg.genre_id = gen.id
LEFT JOIN guides gu ON g.id = gu.game_id AND gu.status = 'published'
GROUP BY g.id, d.name, p.name;
```

### View: User Stats
```sql
CREATE VIEW user_stats AS
SELECT
  u.id,
  u.username,
  COUNT(DISTINCT ucg.id) as total_completed,
  COUNT(DISTINCT CASE WHEN ucg.got_platinum THEN ucg.id END) as total_platinums,
  SUM(ucg.actual_hours) as total_hours,
  COUNT(DISTINCT ub.id) as backlog_count
FROM users u
LEFT JOIN user_completed_games ucg ON u.id = ucg.user_id
LEFT JOIN user_backlog ub ON u.id = ub.user_id
GROUP BY u.id, u.username;
```

---

## 🎯 TRIGGERS για Auto-updates

### Update game stats when guide is added
```sql
CREATE OR REPLACE FUNCTION update_game_guide_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE games
  SET total_guides = (
    SELECT COUNT(*) FROM guides WHERE game_id = NEW.game_id AND status = 'published'
  )
  WHERE id = NEW.game_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_game_guide_count
AFTER INSERT OR UPDATE OR DELETE ON guides
FOR EACH ROW EXECUTE FUNCTION update_game_guide_count();
```

### Update user platinum count
```sql
CREATE OR REPLACE FUNCTION update_user_platinum_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET
    total_platinums = (
      SELECT COUNT(*) FROM user_completed_games
      WHERE user_id = NEW.user_id AND got_platinum = TRUE
    ),
    total_games_completed = (
      SELECT COUNT(*) FROM user_completed_games WHERE user_id = NEW.user_id
    ),
    total_hours_played = (
      SELECT COALESCE(SUM(actual_hours), 0) FROM user_completed_games WHERE user_id = NEW.user_id
    )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats
AFTER INSERT OR UPDATE OR DELETE ON user_completed_games
FOR EACH ROW EXECUTE FUNCTION update_user_platinum_count();
```

---

## 📝 SUMMARY

**Total Tables: 17**

### Core Tables (5):
- users, games, guides, guide_steps, trophies

### Reference Tables (3):
- platforms, genres, developers, publishers

### Relationships (4):
- game_platforms, game_genres, guide_step_trophies, user_guide_likes

### User Features (2):
- user_backlog, user_completed_games

### Social (1):
- comments

### Admin (1):
- admin_logs

---

## 🚀 NEXT STEPS

1. Create new Supabase project
2. Run SQL migrations
3. Import old data from backup
4. Update application code
5. Set up RLS policies
6. Test thoroughly

