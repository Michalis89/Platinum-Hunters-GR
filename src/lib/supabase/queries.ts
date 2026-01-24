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

type UserGameRow = Database['public']['Tables']['user_games']['Row'];
type GameRow = Database['public']['Tables']['games']['Row'];
type UserGameWithGame = UserGameRow & { games: GameRow | GameRow[] | null };

type GetArticlesParams = {
  category?: string | null;
  topic?: string | null;
  status?: string;
  authorId?: string | null;
  featured?: boolean;
  limit: number;
  offset: number;
};

export async function getArticlesWithFilters(
  supabase: DbClient,
  params: GetArticlesParams,
): Promise<{ data: ArticleWithAuthor[] | null; error: PostgrestError | null; count: number | null }> {
  const { category, topic, status, authorId, featured, limit, offset } = params;
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

  const { data, error, count } = await query;
  return { data: data as ArticleWithAuthor[] | null, error, count };
}

type GetUserGamesParams = {
  userId: string;
  limit: number;
  offset: number;
};

export async function getUserGamesWithDetails(
  supabase: DbClient,
  params: GetUserGamesParams,
): Promise<{ data: UserGameWithGame[] | null; error: PostgrestError | null; count: number | null }> {
  const { userId, limit, offset } = params;
  const { data, error, count } = await supabase
    .from('user_games')
    .select(
      `
        id,
        user_id,
        game_id,
        status,
        priority,
        actual_hours_casual,
        actual_hours_platinum,
        notes,
        personal_rating,
        personal_difficulty,
        would_recommend,
        is_favorite,
        added_at,
        started_at,
        completed_at,
        platinumed_at,
        dropped_at,
        games (
          id,
          title,
          slug,
          description,
          cover_image,
          background_image,
          trophy_platinum,
          trophy_gold,
          trophy_silver,
          trophy_bronze,
          trophy_total,
          release_date,
          release_year,
          metacritic_score,
          rating,
          total_guides,
          average_difficulty,
          average_hours,
          created_at,
          updated_at
        )
      `,
      { count: 'exact' },
    )
    .eq('user_id', userId)
    .order('priority', { ascending: false })
    .order('added_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return { data: data as UserGameWithGame[] | null, error, count };
}
