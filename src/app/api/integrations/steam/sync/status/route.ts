import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';

async function GETHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);

    const { data: job, error } = await supabase
      .from('steam_sync_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Job fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch job status' }, { status: 500 });
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      message: job.message,
      percent: job.percent,
      completedSteps: job.completed_steps,
      totalSteps: job.total_steps,
      error: job.error,
      result: job.result,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      finishedAt: job.finished_at,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Failed to check job status' }, { status: 500 });
  }
}

export const GET = withApiRoute(GETHandler);
