import { withApiRoute } from '@/lib/observability/withApiRoute';

import { NextResponse } from 'next/server';

import { API_ERRORS } from '@/lib/api/errors';
import { fail } from '@/lib/api/response';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResetPasswordEmail } from '@/lib/email/send';
import { validateEmail } from '@/utils/validation/auth';
import { rateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit';
import { resolveSiteUrl } from '@/lib/auth/site-url';

async function POSTHandler(req: Request) {
  // Rate limit: 3 requests per hour per IP (Redis-backed, serverless-safe)
  if (process.env.NODE_ENV === 'production') {
    const clientIp = getClientIp(req);
    const rateLimitResult = await rateLimit('forgotIp', clientIp);

    if (!rateLimitResult.success) {
      return fail(
        { error: 'Too many attempts. Please try again later.' },
        429,
        { headers: rateLimitHeaders(rateLimitResult) },
      );
    }
  }

  const siteUrl = resolveSiteUrl(req);

  try {
    const { email } = await req.json();

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return fail({ error: emailValidation.error || 'Invalid email' }, 400);
    }

    const supabase = createSupabaseAdminClient();
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${siteUrl}/pages/auth/reset-password`,
      },
    });

    const actionLink = linkData?.properties?.action_link;
    const hashedToken = linkData?.properties?.hashed_token;
    const recoveryLink = hashedToken
      ? `${siteUrl}/pages/auth/reset-password?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`
      : actionLink;

    if (linkError || !recoveryLink) {
      console.warn('Recovery link generation returned an error or no link', linkError);
      if (linkError) {
        const errorCode = (linkError as { code?: string }).code?.toLowerCase();
        const errorMessage = linkError.message.toLowerCase();
        if (
          errorCode === 'user_not_found' ||
          errorMessage.includes('user with this email not found') ||
          errorMessage.includes('user not found')
        ) {
          return fail(
            {
              error:
                "We couldn't find an account with that email address. Check for typos or create a new account.",
            },
            404,
          );
        }

        return fail(
          { error: 'Unable to process password recovery right now. Please try again shortly.' },
          500,
        );
      }
      return fail(
        { error: 'Unable to process password recovery right now. Please try again shortly.' },
        500,
      );
    }

    try {
      await sendResetPasswordEmail(email, recoveryLink);
    } catch (error) {
      console.error('Failed to send reset password email:', error);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Forgot password handler error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const POST = withApiRoute(POSTHandler);
