// =====================================================
// TROPHY & GUIDE TYPES
// =====================================================

export interface Trophy {
  name: string;
  description: string;
  type: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Unknown';
}

export interface Step {
  title: string;
  description: string;
  trophies: Trophy[];
  content_rich?: unknown;
  content_html?: string;
}

export interface Guide {
  id: number;
  game_id: number;
  title: string;
  description?: string;
  difficulty?: string;
  difficulty_rating?: number;
  estimated_hours?: number;
  estimated_playthroughs?: number;
  status: 'draft' | 'published' | 'archived';
  is_verified: boolean;
  steps?: Step[];
  content_rich?: unknown;
  content_html?: string;
  created_at: string;
  updated_at?: string;
}

// =====================================================
// GAME TYPES (New Schema)
// =====================================================

export interface Game {
  id: number;
  title: string;
  slug: string;
  description?: string;
  cover_image?: string;
  background_image?: string;

  // Trophy counts
  trophy_platinum: number;
  trophy_gold: number;
  trophy_silver: number;
  trophy_bronze: number;
  trophy_total: number;

  // Metadata
  release_date?: string;
  release_year?: number;

  // External IDs
  psn_trophy_id?: string;
  rawg_id?: number;

  // Ratings
  metacritic_score?: number;
  rating?: number;

  // Stats
  total_guides: number;
  total_reviews: number;
  average_difficulty?: number;
  average_hours?: number;
  // Aggregated from guides (computed in API)
  average_playthroughs?: number | null;
  max_playthroughs?: number | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Full game data with relationships (from view)
export interface FullGameData extends Game {
  // Developer & Publisher
  developer_id?: number;
  developer?: string;
  developer_slug?: string;
  publisher_id?: number;
  publisher?: string;
  publisher_slug?: string;

  // Arrays (from joins)
  platforms: string[]; // ['PS5', 'PS4']
  genres: string[]; // ['Action', 'RPG']
}

// =====================================================
// LEGACY TYPES (for backward compatibility during migration)
// =====================================================

export interface TrophiesRecord {
  Platinum: string;
  Gold: string;
  Silver: string;
  Bronze: string;
}

export interface ScrapedGameData {
  title: string;
  difficulty: string;
  difficultyColor: string;
  playthroughs: string;
  playthroughsColor: string;
  hours: string;
  hoursColor: string;
  gameImage: string;
  platform: string;
  trophies: TrophiesRecord;
  totalPoints: number;
  steps: Step[];
}

export interface ApiGame {
  id: number;
  title: string;
  platform: string;
  cover_image: string;
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
}

export interface GameDetails {
  release_year?: number | null;
  developer?: string | null;
  publisher?: string | null;
  genre?: string | null;
  genres?: string[] | null;
  slug?: string | null;
  metacritic?: number | null;
  rating?: number | null;
  platforms?: string[] | null;
  esrb_rating?: string | null;
}

// =====================================================
// UI TYPES
// =====================================================

export interface AlertProps {
  readonly type: 'success' | 'error';
  readonly message: string;
  readonly duration?: number;
}

export interface GuideProps {
  id: number;
  steps: Step[];
}

export interface TrophyGuidesProps {
  guides: GuideProps[];
}

export interface Platform {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface Genre {
  value: string;
  label: string;
}

// =====================================================
// PROCESSED DATA FOR UI
// =====================================================

export interface ProcessedGame extends FullGameData, ScrapedGameData {
  // Computed fields
  totalPoints: number;
  difficultyNumber: number; // For sorting/filtering
  playthroughs: string; //IS THIS CORRECT?
}

export interface GamesResponse {
  games: ProcessedGame[];
  genres: string[];
  developers: string[];
  platforms: string[];
  difficulties: number[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    meta?: {
      developersCount?: number;
      genresCount?: number;
      maxHours?: number | null;
      minYearMeta?: number | null;
      maxYearMeta?: number | null;
    };
  };
}

// =====================================================
// USER FEATURE TYPES (for future implementation)
// =====================================================

export interface UserBacklog {
  id: number;
  user_id: string;
  game_id: number;
  status: 'to_play' | 'playing' | 'completed' | 'platinumed' | 'dropped';
  priority: number;
  notes?: string | null;
  personal_difficulty?: number | null;
  actual_hours_casual?: number | null;
  actual_hours_platinum?: number | null;
  personal_rating?: number | null;
  is_favorite?: boolean | null;
  would_recommend?: boolean | null;
  added_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  platinumed_at?: string | null;
  dropped_at?: string | null;

  // From view join
  game?: FullGameData;
}

export interface UserBacklogWithGame extends Omit<UserBacklog, 'game'> {
  game: FullGameData; // Required game data
}

export interface UserCompletedGame {
  id: number;
  user_id: string;
  game_id: number;
  completed_at: string;
  actual_hours?: number;
  actual_playthroughs?: number;
  rating?: number;
  would_recommend?: boolean;
  review_text?: string;
  got_platinum: boolean;
  platinum_date?: string;
  difficulty_rating?: number;

  // From view join
  game?: FullGameData;
}
