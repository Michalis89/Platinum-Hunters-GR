-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 2: Create Indexes for Performance
-- =====================================================

-- =====================================================
-- GAMES INDEXES
-- =====================================================

CREATE INDEX idx_games_slug ON games(slug);
CREATE INDEX idx_games_title ON games(title);
CREATE INDEX idx_games_release_year ON games(release_year);
CREATE INDEX idx_games_developer ON games(developer_id);
CREATE INDEX idx_games_publisher ON games(publisher_id);
CREATE INDEX idx_games_rating ON games(rating);
CREATE INDEX idx_games_metacritic ON games(metacritic_score);

-- Full-text search index
CREATE INDEX idx_games_search ON games USING GIN(search_vector);

-- =====================================================
-- GUIDES INDEXES
-- =====================================================

CREATE INDEX idx_guides_game ON guides(game_id);
CREATE INDEX idx_guides_author ON guides(author_id);
CREATE INDEX idx_guides_status ON guides(status);
CREATE INDEX idx_guides_published ON guides(published_at) WHERE status = 'published';
CREATE INDEX idx_guides_difficulty ON guides(difficulty_rating);

-- =====================================================
-- GUIDE STEPS INDEXES
-- =====================================================

CREATE INDEX idx_guide_steps_guide ON guide_steps(guide_id);
CREATE INDEX idx_guide_steps_number ON guide_steps(guide_id, step_number);

-- =====================================================
-- TROPHIES INDEXES
-- =====================================================

CREATE INDEX idx_trophies_game ON trophies(game_id);
CREATE INDEX idx_trophies_type ON trophies(type);
CREATE INDEX idx_trophies_psn_id ON trophies(psn_trophy_id);

-- =====================================================
-- USER BACKLOG INDEXES
-- =====================================================

CREATE INDEX idx_backlog_user ON user_backlog(user_id);
CREATE INDEX idx_backlog_game ON user_backlog(game_id);
CREATE INDEX idx_backlog_user_priority ON user_backlog(user_id, priority DESC);
CREATE INDEX idx_backlog_added ON user_backlog(added_at);

-- =====================================================
-- COMPLETED GAMES INDEXES
-- =====================================================

CREATE INDEX idx_completed_user ON user_completed_games(user_id);
CREATE INDEX idx_completed_game ON user_completed_games(game_id);
CREATE INDEX idx_completed_date ON user_completed_games(completed_at);
CREATE INDEX idx_completed_platinum ON user_completed_games(got_platinum) WHERE got_platinum = TRUE;
CREATE INDEX idx_completed_rating ON user_completed_games(rating);

-- =====================================================
-- COMMENTS INDEXES
-- =====================================================

CREATE INDEX idx_comments_target ON comments(commentable_type, commentable_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_created ON comments(created_at DESC);

-- =====================================================
-- USER LIKES INDEXES
-- =====================================================

CREATE INDEX idx_likes_guide ON user_guide_likes(guide_id);
CREATE INDEX idx_likes_user ON user_guide_likes(user_id);

-- =====================================================
-- GAME RELATIONSHIPS INDEXES
-- =====================================================

CREATE INDEX idx_game_platforms_game ON game_platforms(game_id);
CREATE INDEX idx_game_platforms_platform ON game_platforms(platform_id);
CREATE INDEX idx_game_genres_game ON game_genres(game_id);
CREATE INDEX idx_game_genres_genre ON game_genres(genre_id);

-- =====================================================
-- ADMIN LOGS INDEXES
-- =====================================================

CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_admin_logs_target ON admin_logs(target_type, target_id);
CREATE INDEX idx_admin_logs_created ON admin_logs(created_at DESC);

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All indexes created successfully!';
END $$;
