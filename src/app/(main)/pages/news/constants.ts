import type { ArticleCategory, ArticleTopic } from '@/types/database';

export const CATEGORY_LABELS: Partial<Record<ArticleCategory, string>> = {
  games: 'Games',
  anime: 'Anime',
  manga: 'Manga',
  books: 'Βιβλία',
  movies: 'Ταινίες',
  tv: 'Σειρές',
  coding: 'Coding',
  pet: 'Κατοικίδια',
  vape: 'Vape',
};

export const CATEGORY_SUBTITLES: Partial<Record<ArticleCategory, string>> = {
  games: 'Άρθρα, ιστορίες και αναλύσεις γύρω από τα παιχνίδια, με καθαρή ματιά.',
  anime: 'Άρθρα και stories από τον κόσμο του anime.',
  manga: 'Άρθρα και highlights για manga και δημιουργούς.',
  books: 'Άρθρα και ιδέες από βιβλία που αξίζει να διαβάσεις.',
  movies: 'Άρθρα, λίστες και αναλύσεις για ταινίες.',
  tv: 'Άρθρα και highlights για σειρές.',
  coding: 'Άρθρα και παραδείγματα για καθαρό κώδικα και πρακτικές λύσεις.',
  pet: 'Ιστορίες και συμβουλές φροντίδας για ζώα με ήρεμο ρυθμό.',
  vape: 'Άρθρα και εμπειρίες για συσκευές, υγρά και επιλογές.',
};

export const TOPIC_LABELS: Record<ArticleTopic, string> = {
  articles: 'Άρθρα',
  reviews: 'Κριτικές',
  tutorials: 'Μαθήματα',
  'weird-cases': 'Παράξενες Περιπτώσεις',
  care: 'Φροντίδα',
  experiences: 'Εμπειρίες',
  health: 'Υγεία',
  devices: 'Συσκευές',
  liquids: 'Υγρά',
};
