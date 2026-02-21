import type { Database } from '@/lib/supabase/database.types';

export const DIARY_MOODS = [
  'happy',
  'sad',
  'neutral',
  'excited',
  'anxious',
  'calm',
  'frustrated',
] as const;

export type DiaryMood = (typeof DIARY_MOODS)[number];

export type DiaryEntryEncryptedRow = Database['public']['Tables']['diary_entries']['Row'];

export type DiaryEntryDecrypted = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood: DiaryMood | null;
  tags: string[];
  entry_date: string;
  created_at: string;
  updated_at: string;
};

export type DiaryEntryDraft = {
  id?: string;
  title: string;
  content: string;
  mood: DiaryMood | null;
  tags?: string[];
  entry_date: string;
};
