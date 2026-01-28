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
  esrb_rating?: string | null;
  // Aggregated from guides (computed in API)
  average_playthroughs?: number | null;
  max_playthroughs?: number | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}
