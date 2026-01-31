import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

type DbClient = SupabaseClient<Database>;

type ArticleRow = Database['public']['Tables']['articles']['Row'];
type ArticleAuthor = {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};
type ArticleWithAuthor = ArticleRow & { users: ArticleAuthor | null };

type GetArticlesParams = {
  category?: string | null;
  topic?: string | null;
  status?: string;
  authorId?: string | null;
  featured?: boolean;
  tag?: string | null;
  limit: number;
  offset: number;
};

export async function getArticlesWithFilters(
  supabase: DbClient,
  params: GetArticlesParams,
): Promise<{ data: ArticleWithAuthor[] | null; error: PostgrestError | null; count: number | null }> {
  const { category, topic, status, authorId, featured, limit, offset, tag } = params;
  const resolvedStatus = status ?? 'published';

  let query = supabase
    .from('articles')
    .select('*, users!author_id(username, display_name, avatar_url)', { count: 'exact' })
    .eq('status', resolvedStatus)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq('category', category);
  }
  if (topic) {
    query = query.eq('topic', topic);
  }
  if (authorId) {
    query = query.eq('author_id', authorId);
  }
  if (featured) {
    query = query.eq('is_featured', true);
  }
  if (tag) {
    query = query.contains('tags', [tag]);
  }

  const { data, error, count } = await query;
  return { data: data as ArticleWithAuthor[] | null, error, count };
}
