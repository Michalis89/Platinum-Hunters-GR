-- RC-006: enforce uniqueness for active users to prevent signup TOCTOU duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_active_unique_idx
ON public.users (email)
WHERE account_status IS DISTINCT FROM 'deleted';

CREATE UNIQUE INDEX IF NOT EXISTS users_username_active_unique_idx
ON public.users (username)
WHERE account_status IS DISTINCT FROM 'deleted';
