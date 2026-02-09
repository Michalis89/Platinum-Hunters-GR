import { randomUUID } from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type SteamSyncJobStatus = 'running' | 'completed' | 'failed';

export type SteamSyncJobSnapshot = {
  id: string;
  status: SteamSyncJobStatus;
  message: string;
  percent: number;
  completedSteps: number;
  totalSteps: number;
  createdAt: number;
  updatedAt: number;
  finishedAt?: number;
  error?: string;
  result?: unknown;
};

type DbSteamSyncJob = {
  id: string;
  user_id: string;
  status: SteamSyncJobStatus;
  message: string;
  percent: number;
  completed_steps: number;
  total_steps: number;
  error: string | null;
  result: unknown;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
  expires_at: string;
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function dbToSnapshot(job: DbSteamSyncJob): SteamSyncJobSnapshot {
  return {
    id: job.id,
    status: job.status,
    message: job.message,
    percent: job.percent,
    completedSteps: job.completed_steps,
    totalSteps: job.total_steps,
    createdAt: new Date(job.created_at).getTime(),
    updatedAt: new Date(job.updated_at).getTime(),
    finishedAt: job.finished_at ? new Date(job.finished_at).getTime() : undefined,
    error: job.error ?? undefined,
    result: job.result,
  };
}

async function cleanupExpiredJobs() {
  try {
    const supabase = createSupabaseAdminClient();
    await supabase.rpc('cleanup_expired_steam_sync_jobs');
  } catch (error) {
    console.warn('Failed to cleanup expired steam sync jobs:', error);
  }
}

export async function createSteamSyncJob(
  userId: string,
  initialMessage = 'Ξεκίνησε ο συγχρονισμός Steam...',
): Promise<SteamSyncJobSnapshot> {
  await cleanupExpiredJobs();

  const supabase = createSupabaseAdminClient();
  const jobId = randomUUID();

  const { data, error } = await supabase
    .from('steam_sync_jobs')
    .insert({
      id: jobId,
      user_id: userId,
      status: 'running',
      message: initialMessage,
      percent: 0,
      completed_steps: 0,
      total_steps: 1,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create steam sync job: ${error?.message}`);
  }

  return dbToSnapshot(data as DbSteamSyncJob);
}

export async function updateSteamSyncJobProgress(
  jobId: string,
  payload: { message?: string; completedSteps?: number; totalSteps?: number },
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from('steam_sync_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (fetchError || !existing || existing.status !== 'running') {
    return;
  }

  const totalSteps = Math.max(1, payload.totalSteps ?? existing.total_steps);
  const completedSteps = Math.max(0, payload.completedSteps ?? existing.completed_steps);
  const percent = clampPercent((completedSteps / totalSteps) * 100);

  const updatePayload: Record<string, unknown> = {
    total_steps: totalSteps,
    completed_steps: Math.min(completedSteps, totalSteps),
    percent,
  };

  if (payload.message) {
    updatePayload.message = payload.message;
  }

  await supabase.from('steam_sync_jobs').update(updatePayload).eq('id', jobId);
}

export async function completeSteamSyncJob(jobId: string, result: unknown): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { data: existing } = await supabase
    .from('steam_sync_jobs')
    .select('total_steps')
    .eq('id', jobId)
    .single();

  if (!existing) return;

  await supabase
    .from('steam_sync_jobs')
    .update({
      status: 'completed',
      completed_steps: existing.total_steps,
      percent: 100,
      message: 'Ο συγχρονισμός Steam ολοκληρώθηκε.',
      result,
      finished_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

export async function failSteamSyncJob(jobId: string, error: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  await supabase
    .from('steam_sync_jobs')
    .update({
      status: 'failed',
      error,
      message: error || 'Ο συγχρονισμός Steam απέτυχε.',
      finished_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

export async function getSteamSyncJob(jobId: string): Promise<SteamSyncJobSnapshot | null> {
  await cleanupExpiredJobs();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('steam_sync_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error || !data) {
    return null;
  }

  return dbToSnapshot(data as DbSteamSyncJob);
}
