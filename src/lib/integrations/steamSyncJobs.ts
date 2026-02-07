import { randomUUID } from 'crypto';

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

const jobs = new Map<string, SteamSyncJobSnapshot>();
const JOB_TTL_MS = 30 * 60 * 1000;

function now() {
  return Date.now();
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function cleanupExpiredJobs() {
  const threshold = now() - JOB_TTL_MS;
  for (const [id, job] of jobs.entries()) {
    if ((job.finishedAt ?? job.updatedAt) < threshold) {
      jobs.delete(id);
    }
  }
}

export function createSteamSyncJob(
  initialMessage = 'Ξεκίνησε ο συγχρονισμός Steam...',
): SteamSyncJobSnapshot {
  cleanupExpiredJobs();
  const timestamp = now();
  const job: SteamSyncJobSnapshot = {
    id: randomUUID(),
    status: 'running',
    message: initialMessage,
    percent: 0,
    completedSteps: 0,
    totalSteps: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  jobs.set(job.id, job);
  return job;
}

export function updateSteamSyncJobProgress(
  jobId: string,
  payload: { message?: string; completedSteps?: number; totalSteps?: number },
) {
  const existing = jobs.get(jobId);
  if (!existing || existing.status !== 'running') {
    return;
  }

  const totalSteps = Math.max(1, payload.totalSteps ?? existing.totalSteps);
  const completedSteps = Math.max(0, payload.completedSteps ?? existing.completedSteps);
  existing.totalSteps = totalSteps;
  existing.completedSteps = Math.min(completedSteps, totalSteps);
  existing.percent = clampPercent((existing.completedSteps / existing.totalSteps) * 100);
  if (payload.message) {
    existing.message = payload.message;
  }
  existing.updatedAt = now();
  jobs.set(jobId, existing);
}

export function completeSteamSyncJob(jobId: string, result: unknown) {
  const existing = jobs.get(jobId);
  if (!existing) return;

  const timestamp = now();
  existing.status = 'completed';
  existing.completedSteps = existing.totalSteps;
  existing.percent = 100;
  existing.message = 'Ο συγχρονισμός Steam ολοκληρώθηκε.';
  existing.result = result;
  existing.updatedAt = timestamp;
  existing.finishedAt = timestamp;
  jobs.set(jobId, existing);
}

export function failSteamSyncJob(jobId: string, error: string) {
  const existing = jobs.get(jobId);
  if (!existing) return;

  const timestamp = now();
  existing.status = 'failed';
  existing.error = error;
  existing.message = error || 'Ο συγχρονισμός Steam απέτυχε.';
  existing.updatedAt = timestamp;
  existing.finishedAt = timestamp;
  jobs.set(jobId, existing);
}

export function getSteamSyncJob(jobId: string): SteamSyncJobSnapshot | null {
  cleanupExpiredJobs();
  return jobs.get(jobId) ?? null;
}

