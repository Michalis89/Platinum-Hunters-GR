import { randomUUID } from 'crypto';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import type { Database } from '@/lib/supabase/database.types';
import type { JobUpdate } from './helpers';
import { SyncAlreadyRunningError } from './helpers';

export async function getUserSteamInput(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  userId: string,
): Promise<string | null> {
  const { data: categoryData, error: categoryError } = await supabase
    .from('user_category_profiles')
    .select('profiles')
    .eq('user_id', userId)
    .maybeSingle();

  if (categoryError) {
    console.error('[Steam Sync] Category profile fetch error:', categoryError);
    throw new Error(categoryError.message || 'Failed to fetch category profile');
  }

  const categorySteamIdRaw = (
    categoryData?.profiles as { games?: { steam_id?: string | null } } | null | undefined
  )?.games?.steam_id;
  const categorySteamId = typeof categorySteamIdRaw === 'string' ? categorySteamIdRaw.trim() : null;
  return categorySteamId || null;
}

export async function createSyncJob(userId: string): Promise<string> {
  const supabase = await createRouteHandlerClient();
  const jobId = randomUUID();

  const { error } = await supabase.from('steam_sync_jobs').insert({
    id: jobId,
    user_id: userId,
    status: 'running',
    message: 'Starting Steam sync...',
    percent: 0,
    completed_steps: 0,
    total_steps: 1,
  });

  if (error) {
    if (error.code === '23505') {
      const runningJob = await getRunningSyncJob(userId).catch(() => null);
      throw new SyncAlreadyRunningError(runningJob?.id ?? null);
    }
    console.error('Failed to create sync job:', error);
    throw new Error('Failed to create sync job');
  }

  return jobId;
}

export async function getRunningSyncJob(userId: string): Promise<{ id: string } | null> {
  const supabase = await createRouteHandlerClient();

  const { data, error } = await supabase
    .from('steam_sync_jobs')
    .select('id,status')
    .eq('user_id', userId)
    .eq('status', 'running')
    .maybeSingle();

  if (error) {
    console.error('Failed to check running sync job:', error);
    throw new Error('Failed to check running sync job');
  }

  return data ? { id: data.id as string } : null;
}

export async function updateSyncJob(jobId: string, updates: JobUpdate): Promise<void> {
  const supabase = await createRouteHandlerClient();

  const { error } = await supabase
    .from('steam_sync_jobs')
    .update({
      ...(updates.status && { status: updates.status }),
      ...(updates.message && { message: updates.message }),
      ...(typeof updates.percent === 'number' && { percent: updates.percent }),
      ...(typeof updates.completedSteps === 'number' && {
        completed_steps: updates.completedSteps,
      }),
      ...(typeof updates.totalSteps === 'number' && { total_steps: updates.totalSteps }),
      ...(updates.error !== undefined && { error: updates.error }),
      ...(updates.result !== undefined && {
        result:
          updates.result as unknown as Database['public']['Tables']['steam_sync_jobs']['Update']['result'],
      }),
      ...(updates.finishedAt !== undefined && { finished_at: updates.finishedAt }),
    })
    .eq('id', jobId);

  if (error) {
    console.warn('Failed to update sync job:', error);
  }
}
