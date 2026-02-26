import getSupabaseServer from '@/lib/supabase-server';
import { withApiRoute } from '@/lib/observability/withApiRoute';

async function POSTHandler(req: Request) {
  try {
    const body = await req.json();
    const articleId = Number(body?.articleId);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid articleId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getSupabaseServer();
    const { error } = await supabase.from('article_views').insert({
      article_id: articleId,
      user_id: null,
    });

    if (error) {
      console.error('Track view insert error:', error);
      return new Response(JSON.stringify({ error: 'Failed to track view' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Track view request error:', error);
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const POST = withApiRoute(POSTHandler);
