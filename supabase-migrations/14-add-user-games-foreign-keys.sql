-- Add Foreign Key Constraints to user_games table
-- This allows Supabase to automatically JOIN with related tables

-- Add foreign key to games table
ALTER TABLE user_games
ADD CONSTRAINT user_games_game_id_fkey
FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;

-- Add foreign key to users table (auth.users)
ALTER TABLE user_games
ADD CONSTRAINT user_games_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance on queries
CREATE INDEX IF NOT EXISTS idx_user_games_user_id ON user_games(user_id);
CREATE INDEX IF NOT EXISTS idx_user_games_game_id ON user_games(game_id);
CREATE INDEX IF NOT EXISTS idx_user_games_status ON user_games(status);
