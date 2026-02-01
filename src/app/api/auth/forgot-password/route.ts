import { withApiRoute } from '@/lib/observability/withApiRoute';

import { NextResponse } from 'next/server';

import { API_ERRORS } from '@/lib/api/errors';
import { fail } from '@/lib/api/response';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResetPasswordEmail } from '@/lib/email/send';
import { validateEmail } from '@/utils/validation/auth';

async function POSTHandler(req: Request) {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) {
    console.error('Missing SITE_URL environment variable for forgot-password flow');
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }

  try {
    const { email } = await req.json();

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return fail({ error: emailValidation.error || 'Μη έγκυρο email' }, 400);
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
    if (linkError || !actionLink) {
      console.warn('Recovery link generation returned an error or no link', linkError);
      return NextResponse.json({ ok: true });
    }

    try {
      await sendResetPasswordEmail(email, actionLink);
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
