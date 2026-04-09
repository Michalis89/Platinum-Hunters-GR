import type { MediaCandidate, MediaHistoryEntry } from '../types';

export type AnimeRecommendationSource = 'backlog' | 'database';
export type AnimeRecommendationSubtype = 'continuation' | 'best_fit' | 'discovery';

export type AnimeTasteProfile = {
  summary: string;
  coreGenres: Array<{ name: string; weight: number }>;
  topThemes: Array<{ name: string; weight: number }>;
  viewerStyles: Array<{ name: string; weight: number }>;
  premiumSignals?: Array<{ name: string; weight: number }>;
  negativeSignals?: Array<{ name: string; weight: number }>;
};

export type AnimeRecommendation = {
  mediaId: number;
  title: string;
  slug?: string;
  cover?: string;
  source: AnimeRecommendationSource;
  subtype: AnimeRecommendationSubtype;
  reason: string;
  confidence: number;
  score: number;
  genres: string[];
  matchedSignals: string[];
};

export type AnimeTasteSignals = {
  battleAxisGenres: Set<string>;
  premiumAxisGenres: Set<string>;
  suspenseAxisGenres: Set<string>;
  lovedGenreKeys: Set<string>;
  avoidedGenreKeys: Set<string>;
  premiumAxisStrength: number;
  hasSingleTenFavoriteMasterpiece: boolean;
  topEvidenceTitles: string[];
};

export type AnimeTasteComputation = {
  profile: AnimeTasteProfile;
  signals: AnimeTasteSignals;
};

export type AnimeRecommendationEngineInput = {
  history: MediaHistoryEntry[];
  backlog: MediaHistoryEntry[];
  databaseCandidates: MediaCandidate[];
  taste: AnimeTasteComputation;
};

export type AnimeRecommendationResult = {
  tasteProfile: AnimeTasteProfile;
  backlogPicks: AnimeRecommendation[];
  possibleNext: AnimeRecommendation[];
  debug?: {
    completedCount: number;
    inProgressCount: number;
    droppedCount: number;
    backlogCount: number;
  };
};
