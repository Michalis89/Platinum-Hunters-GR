import type { ArticleCategory, ArticleTopic } from '@/types/database';

export const CATEGORY_LABELS: Partial<Record<ArticleCategory, string>> = {
  gaming: 'Gaming',
  coding: 'Coding',
  pet: 'Κατοικίδια',
  vape: 'Vape',
};

export const CATEGORY_SUBTITLES: Partial<Record<ArticleCategory, string>> = {
  gaming: 'Άρθρα, ιστορίες και οδηγοί γύρω από τα παιχνίδια, με καθαρή ματιά.',
  coding: 'Άρθρα και οδηγοί για καθαρό κώδικα και πρακτικές λύσεις.',
  pet: 'Ιστορίες και οδηγοί φροντίδας για ζώα με ήρεμο ρυθμό.',
  vape: 'Άρθρα και εμπειρίες για συσκευές, υγρά και επιλογές.',
};

export const TOPIC_LABELS: Record<ArticleTopic, string> = {
  articles: 'Άρθρα',
  reviews: 'Κριτικές',
  tutorials: 'Μαθήματα',
  guides: 'Οδηγοί',
  'weird-cases': 'Παράξενες Περιπτώσεις',
  care: 'Φροντίδα',
  experiences: 'Εμπειρίες',
  health: 'Υγεία',
  devices: 'Συσκευές',
  liquids: 'Υγρά',
};
