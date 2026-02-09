import { withApiRoute } from '@/lib/observability/withApiRoute';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { validatePassword } from '@/utils/validation/auth';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { clearAuthCookies, isSessionError, SESSION_ERRORS } from '@/lib/auth';

/**
 * Update Password API Route
 * POST /api/auth/update-password
 * Updates user password during password reset flow
 */

async function POSTHandler(req: Request) {
  try {
    const body = await req.json();
    const { password } = body;

    // Validate password format
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return fail({ error: passwordValidation.error || 'Invalid password format' }, 400);
    }

    // Create authenticated client from session cookies
    const supabase = await createRouteHandlerClient();

    // Verify session exists
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return fail({ error: SESSION_ERRORS.RECOVERY_EXPIRED }, 401);
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      console.error('Password update error:', updateError);

      // Check for session-related errors using shared utility
      if (isSessionError(updateError.message)) {
        return fail({ error: SESSION_ERRORS.RECOVERY_EXPIRED }, 401);
      }

      return fail({ error: 'Unable to update password. Please try again.' }, 500);
    }

    // Sign out after successful password update
    await supabase.auth.signOut();

    // Clear session cookies using shared utility
    await clearAuthCookies();

    return ok({
      message: 'Password updated successfully. Please sign in with your new password.',
    });
  } catch (error) {
    console.error('Update password handler error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const POST = withApiRoute(POSTHandler);
