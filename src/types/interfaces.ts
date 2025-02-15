export interface Trophy {
  name: string;
  description: string;
  type: "Bronze" | "Silver" | "Gold" | "Platinum" | "Unknown";
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
