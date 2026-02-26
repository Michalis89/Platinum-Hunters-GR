import type { ArticleCategory, ArticleTopic } from '@/types/database';

export const CATEGORY_LABELS: Partial<Record<ArticleCategory, string>> = {
  games: 'Games',
  anime: 'Anime',
  manga: 'Manga',
  books: 'Books',
  movies: 'Movies',
  tv: 'TV',
  coding: 'Coding',
  pet: 'Pets',
  vape: 'Vape',
};

export const CATEGORY_SUBTITLES: Partial<Record<ArticleCategory, string>> = {
  games: 'Articles, stories, and deep dives from the world of gaming.',
  anime: 'Features and community stories from the anime scene.',
  manga: 'Highlights, recommendations, and creator-focused manga reads.',
  books: 'Thoughtful book picks, reading insights, and literary stories.',
  movies: 'Film features, curated lists, and cinematic analysis.',
  tv: 'TV highlights, episode breakdowns, and binge-worthy picks.',
  coding: 'Practical coding articles, clear examples, and real-world solutions.',
  pet: 'Pet care guidance and real stories from everyday pet owners.',
  vape: 'Straightforward guides on devices, liquids, and vape choices.',
};

export const TOPIC_LABELS: Record<ArticleTopic, string> = {
  articles: 'Articles',
  reviews: 'Reviews',
  tutorials: 'Tutorials',
  'weird-cases': 'Edge Cases',
  care: 'Care',
  experiences: 'Stories',
  health: 'Health',
  devices: 'Devices',
  liquids: 'E-Liquids',
};
