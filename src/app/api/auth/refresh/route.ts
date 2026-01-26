/**
 * Token Refresh API Route
 * POST /api/auth/refresh
 * Syncs the session cookies when Supabase refreshes tokens
 */

import { cookies } from 'next/headers';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { access_token, refresh_token, expires_in } = body;

    if (!access_token || !refresh_token) {
      return fail({ error: 'Λείπουν τα tokens' }, 400);
    }

    const cookieStore = await cookies();
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: expires_in || 3600,
    };

    // Update cookies with new tokens
    cookieStore.set('sb-access-token', access_token, cookieOptions);
    cookieStore.set('sb-refresh-token', refresh_token, cookieOptions);

    return ok({ success: true });
  } catch (error) {
    console.error('Token refresh error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}
