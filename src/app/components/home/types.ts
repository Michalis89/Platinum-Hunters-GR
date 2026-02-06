export type CategoryStats = {
  total: number;
  in_progress: number;
  completed: number;
  dropped: number;
  hours: number;
};

export type PersonalStats = {
  total_backlog: number;
  in_progress: number;
  completed: number;
  total_hours: number;
  games: CategoryStats;
  anime: CategoryStats;
  manga: CategoryStats & { chapters: number };
  movies: CategoryStats;
  tv: CategoryStats;
  books: CategoryStats & { pages: number };
  active_categories: string[];
};

