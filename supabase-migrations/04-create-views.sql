-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 4: Create Views for Common Queries
-- =====================================================

-- =====================================================
-- FULL GAME DATA VIEW
-- =====================================================

-- Combines game with all related data (developer, publisher, platforms, genres, guides)
CREATE OR REPLACE VIEW full_game_data AS
SELECT
  g.id,
  g.title,
  g.slug,
  g.description,
  g.cover_image,
  g.background_image,
  g.trophy_platinum,
  g.trophy_gold,
  g.trophy_silver,
  g.trophy_bronze,
  g.trophy_total,
  g.release_date,
  g.release_year,
  g.metacritic_score,
  g.rating,
  g.total_guides,
  g.total_reviews,
  g.average_difficulty,
  g.average_hours,
  g.created_at,
  g.updated_at,

  -- Developer & Publisher
  d.id as developer_id,
  d.name as developer,
  d.slug as developer_slug,
  p.id as publisher_id,
  p.name as publisher,
  p.slug as publisher_slug,

  -- Platforms (array)
  COALESCE(
    array_agg(DISTINCT pl.short_name) FILTER (WHERE pl.short_name IS NOT NULL),
    ARRAY[]::TEXT[]
  ) as platforms,

  -- Genres (array)
  COALESCE(
    array_agg(DISTINCT gen.name) FILTER (WHERE gen.name IS NOT NULL),
    ARRAY[]::TEXT[]
  ) as genres,

  -- External IDs
  g.psn_trophy_id,
  g.rawg_id

FROM games g
LEFT JOIN developers d ON g.developer_id = d.id
LEFT JOIN publishers p ON g.publisher_id = p.id
LEFT JOIN game_platforms gp ON g.id = gp.game_id
LEFT JOIN platforms pl ON gp.platform_id = pl.id
LEFT JOIN game_genres gg ON g.id = gg.game_id
LEFT JOIN genres gen ON gg.genre_id = gen.id
GROUP BY
  g.id,
  d.id, d.name, d.slug,
  p.id, p.name, p.slug;

-- =====================================================
-- USER STATS VIEW
-- =====================================================

-- User statistics (completed games, platinums, hours, backlog)
CREATE OR REPLACE VIEW user_stats AS
SELECT
  u.id,
  u.username,
  u.display_name,
  u.avatar_url,
  u.role,
  u.total_games_completed,
  u.total_hours_played,
  u.total_platinums,

  -- Backlog count
  (SELECT COUNT(*) FROM user_backlog WHERE user_id = u.id) as backlog_count,

  -- Average rating given
  (SELECT AVG(rating) FROM user_completed_games WHERE user_id = u.id) as average_rating,

  -- Guides written
  (SELECT COUNT(*) FROM guides WHERE author_id = u.id AND status = 'published') as guides_written,

  -- Comments made
  (SELECT COUNT(*) FROM comments WHERE user_id = u.id) as comments_count,

  u.created_at

FROM users u;

-- =====================================================
-- GUIDE WITH GAME INFO VIEW
-- =====================================================

-- Guides with game information
CREATE OR REPLACE VIEW guides_with_game AS
SELECT
  gu.id,
  gu.game_id,
  gu.title,
  gu.description,
  gu.difficulty,
  gu.difficulty_rating,
  gu.estimated_hours,
  gu.estimated_playthroughs,
  gu.status,
  gu.is_verified,
  gu.views,
  gu.likes,
  gu.created_at,
  gu.updated_at,
  gu.published_at,

  -- Game info
  g.title as game_title,
  g.slug as game_slug,
  g.cover_image as game_cover_image,
  g.trophy_platinum,
  g.trophy_gold,
  g.trophy_silver,
  g.trophy_bronze,
  g.trophy_total,

  -- Author info
  u.id as author_id,
  u.username as author_username,
  u.display_name as author_display_name,
  u.avatar_url as author_avatar

FROM guides gu
INNER JOIN games g ON gu.game_id = g.id
LEFT JOIN users u ON gu.author_id = u.id;

-- =====================================================
-- USER BACKLOG WITH GAME INFO
-- =====================================================

-- User's backlog with full game information
CREATE OR REPLACE VIEW user_backlog_with_game AS
SELECT
  ub.id as backlog_id,
  ub.user_id,
  ub.game_id,
  ub.priority,
  ub.notes,
  ub.added_at,

  -- Game info from full_game_data view
  fgd.title,
  fgd.slug,
  fgd.description,
  fgd.cover_image,
  fgd.background_image,
  fgd.trophy_platinum,
  fgd.trophy_gold,
  fgd.trophy_silver,
  fgd.trophy_bronze,
  fgd.trophy_total,
  fgd.release_date,
  fgd.release_year,
  fgd.metacritic_score,
  fgd.rating as game_rating,
  fgd.total_guides,
  fgd.total_reviews,
  fgd.average_difficulty,
  fgd.average_hours,
  fgd.developer_id,
  fgd.developer,
  fgd.developer_slug,
  fgd.publisher_id,
  fgd.publisher,
  fgd.publisher_slug,
  fgd.platforms,
  fgd.genres,
  fgd.psn_trophy_id,
  fgd.rawg_id

FROM user_backlog ub
INNER JOIN full_game_data fgd ON ub.game_id = fgd.id;

-- =====================================================
-- USER COMPLETED GAMES WITH INFO
-- =====================================================

-- User's completed games with full information
CREATE OR REPLACE VIEW user_completed_with_game AS
SELECT
  ucg.id as completion_id,
  ucg.user_id,
  ucg.game_id,
  ucg.completed_at,
  ucg.actual_hours,
  ucg.actual_playthroughs,
  ucg.rating,
  ucg.would_recommend,
  ucg.review_text,
  ucg.got_platinum,
  ucg.platinum_date,
  ucg.difficulty_rating,

  -- Game info from full_game_data view
  fgd.title,
  fgd.slug,
  fgd.description,
  fgd.cover_image,
  fgd.background_image,
  fgd.trophy_platinum,
  fgd.trophy_gold,
  fgd.trophy_silver,
  fgd.trophy_bronze,
  fgd.trophy_total,
  fgd.release_date,
  fgd.release_year,
  fgd.metacritic_score,
  fgd.rating as game_rating,
  fgd.total_guides,
  fgd.total_reviews,
  fgd.average_difficulty,
  fgd.average_hours,
  fgd.developer_id,
  fgd.developer,
  fgd.developer_slug,
  fgd.publisher_id,
  fgd.publisher,
  fgd.publisher_slug,
  fgd.platforms,
  fgd.genres,
  fgd.psn_trophy_id,
  fgd.rawg_id

FROM user_completed_games ucg
INNER JOIN full_game_data fgd ON ucg.game_id = fgd.id;

-- =====================================================
-- POPULAR GAMES VIEW
-- =====================================================

-- Games ordered by popularity (guides + reviews + backlog)
CREATE OR REPLACE VIEW popular_games AS
SELECT
  g.*,

  -- Popularity metrics (total_guides already in g.*)
  (SELECT COUNT(*) FROM user_backlog WHERE game_id = g.id) as in_backlog_count,
  (SELECT COUNT(*) FROM user_completed_games WHERE game_id = g.id) as completed_count,
  (SELECT AVG(rating) FROM user_completed_games WHERE game_id = g.id) as user_average_rating,

  -- Popularity score (weighted)
  (
    g.total_guides * 10 +
    (SELECT COUNT(*) FROM user_backlog WHERE game_id = g.id) * 2 +
    (SELECT COUNT(*) FROM user_completed_games WHERE game_id = g.id) * 5
  ) as popularity_score

FROM games g
ORDER BY popularity_score DESC;

-- =====================================================
-- TRENDING PLATINUMS VIEW
-- =====================================================

-- Recently earned platinums
CREATE OR REPLACE VIEW trending_platinums AS
SELECT
  ucg.id,
  ucg.user_id,
  ucg.game_id,
  ucg.platinum_date,
  ucg.actual_hours,
  ucg.difficulty_rating,

  -- User info
  u.username,
  u.display_name,
  u.avatar_url,

  -- Game info
  g.title as game_title,
  g.slug as game_slug,
  g.cover_image as game_cover_image

FROM user_completed_games ucg
INNER JOIN users u ON ucg.user_id = u.id
INNER JOIN games g ON ucg.game_id = g.id
WHERE ucg.got_platinum = TRUE AND ucg.platinum_date IS NOT NULL
ORDER BY ucg.platinum_date DESC;

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All views created successfully!';
END $$;
