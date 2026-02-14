/**
 * API Permissions
 * Server-side permission checking utilities for API routes
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api/auth';
import { hasAnyRole } from '@/lib/roles';
import { getUserFullInfo } from '@/lib/services/userService';

export class ForbiddenError extends Error {
  code = 'FORBIDDEN';

  constructor(message = 'Access forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Require admin/owner/moderator roles
 * Throws ForbiddenError if user doesn't have required role
 */
export async function requireAdminRole(supabase: SupabaseClient): Promise<{
  session: Awaited<ReturnType<typeof requireAuth>>;
  user: NonNullable<Awaited<ReturnType<typeof getUserFullInfo>>>;
}> {
  const session = await requireAuth(supabase);
  const user = await getUserFullInfo(supabase, session.user.id);

  if (!user || !hasAnyRole(user, ['admin', 'owner', 'moderator'])) {
    throw new ForbiddenError('Admin access required');
  }

  return { session, user };
}

/**
 * Require author-level permissions (admin, owner, author, reviewer)
 */
export async function requireAuthorRole(supabase: SupabaseClient): Promise<{
  session: Awaited<ReturnType<typeof requireAuth>>;
  user: NonNullable<Awaited<ReturnType<typeof getUserFullInfo>>>;
}> {
  const session = await requireAuth(supabase);
  const user = await getUserFullInfo(supabase, session.user.id);

  if (!user || !hasAnyRole(user, ['admin', 'owner', 'author', 'reviewer'])) {
    throw new ForbiddenError('Author access required');
  }

  return { session, user };
}
