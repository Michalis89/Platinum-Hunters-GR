export interface Trophy {
  name: string;
  description: string;
  type: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Unknown';
}

export interface Step {
  title: string;
  description: string;
  trophies: Trophy[];
}

export interface Game {
  id?: number;
  title: string;
  platform: string;
  game_image: string;
  trophies: {
    Platinum: string;
    Gold: string;
    Silver: string;
    Bronze: string;
  };
  totalPoints: number;
  steps: Step[];
}

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
  game_image: string;
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
}
export interface Guide {
  id: number;
  game_id: number;
  difficulty: string;
  playthroughs: number;
  steps: Step[];
  created_at: string;
  difficulty_color: string;
  playthroughs_color: string;
  hours_color: string;
  hours: number;
}

export interface AlertProps {
  readonly type: 'success' | 'error';
  readonly message: string;
  readonly duration?: number;
}

export interface GameDetails {
  release_year?: number | null;
  developer?: string | null;
  publisher?: string | null;
  genre?: string | null;
  slug?: string | null;
  metacritic?: number | null;
  rating?: number | null;
  platforms?: string[] | null;
  esrb_rating?: string | null;
}

export interface GuideProps {
  id: number;
  steps: Step[];
}
export interface TrophyGuidesProps {
  guides: GuideProps[];
}

export interface CombinedGame {
  id: number;
  title: string;
  platform: string;
  game_image: string;
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
  release_year?: number;
  developer?: string;
  publisher?: string;
  genre?: string;
  slug?: string;
  metacritic?: number;
  rating?: number;
  platforms?: string[];
  esrb_rating?: string;
  difficulty?: string;
  playthroughs?: number;
  totalPoints?: number;
  hours?: number;
  steps?: {
    title: string;
    trophies: {
      name: string;
      type: string;
      description: string;
    }[];
    description: string;
  }[];
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
export interface ProcessedGame extends Omit<CombinedGame, 'difficulty'> {
  difficulty: number;
}

export interface GamesResponse {
  games: ProcessedGame[];
  genres: string[];
  developer: string[];
  platforms: string[];
  difficulty: number[];
}
