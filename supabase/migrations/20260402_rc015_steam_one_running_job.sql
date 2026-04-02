-- RC-015: enforce one running Steam sync job per user.
-- Cleanup first: if duplicates exist, keep the most recently updated running job
-- per user and mark the rest as failed so the unique index can be created safely.
WITH ranked_running_jobs AS (
  SELECT
    id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) AS rn
  FROM public.steam_sync_jobs
  WHERE status = 'running'
),
duplicates_to_fail AS (
  SELECT id
  FROM ranked_running_jobs
  WHERE rn > 1
)
UPDATE public.steam_sync_jobs j
SET
  status = 'failed',
  error = COALESCE(j.error, 'Auto-failed by migration: duplicate running Steam sync job'),
  finished_at = COALESCE(j.finished_at, now()),
  message = COALESCE(NULLIF(j.message, ''), 'Steam sync failed')
FROM duplicates_to_fail d
WHERE j.id = d.id;

CREATE UNIQUE INDEX IF NOT EXISTS steam_sync_jobs_one_running_per_user
ON public.steam_sync_jobs (user_id)
WHERE status = 'running';
