import { withApiRoute } from '@/lib/observability/withApiRoute';

import { NextResponse } from 'next/server';

import { API_ERRORS } from '@/lib/api/errors';
import { fail } from '@/lib/api/response';
import { rateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit';
import { verifyCaptchaToken } from '@/lib/captcha/turnstile';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendConfirmEmail } from '@/lib/email/send';
import { resolveSiteUrl } from '@/lib/auth/site-url';
import {
  LEGAL_PATHS,
  PRIVACY_POLICY_VERSION,
  TERMS_OF_USE_VERSION,
} from '@/lib/legal/policyVersions';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validateFullName,
} from '@/utils/validation/auth';

async function POSTHandler(req: Request) {
  const siteUrl = resolveSiteUrl(req);
  let step = 'rate_limit';

  const clientIp = getClientIp(req);
  const rateLimitResult = await rateLimit('registerIp', clientIp);
  if (!rateLimitResult.success) {
    return fail({ error: 'Too many sign-up attempts. Please try again later.' }, 429, {
      headers: rateLimitHeaders(rateLimitResult),
    });
  }

  try {
    step = 'parse_body';
    const body = await req.json();
    const {
      email,
      password,
      username,
      agree_to_terms,
      acceptedPolicies,
      full_name,
      date_of_birth,
      country,
      bio,
      steam_id,
      captchaToken,
    } = body;

    if (agree_to_terms !== true) {
      return fail({ error: 'You must accept the terms of use and privacy policy.' }, 400);
    }

    const acceptedAt =
      typeof acceptedPolicies?.acceptedAt === 'string' ? acceptedPolicies.acceptedAt : null;
    const acceptedAtDate = acceptedAt ? new Date(acceptedAt) : null;
    const acceptedAtValid = Boolean(acceptedAtDate && Number.isFinite(acceptedAtDate.getTime()));

    const hasValidPolicyVersions =
      acceptedPolicies?.termsVersion === TERMS_OF_USE_VERSION &&
      acceptedPolicies?.privacyVersion === PRIVACY_POLICY_VERSION &&
      acceptedPolicies?.termsPath === LEGAL_PATHS.terms &&
      acceptedPolicies?.privacyPath === LEGAL_PATHS.privacy;

    if (!hasValidPolicyVersions || !acceptedAtValid) {
      return fail({ error: 'Policy consent is invalid. Refresh and try again.' }, 400);
    }

    const legalAcceptance = {
      terms_version: TERMS_OF_USE_VERSION,
      privacy_version: PRIVACY_POLICY_VERSION,
      terms_path: LEGAL_PATHS.terms,
      privacy_path: LEGAL_PATHS.privacy,
      accepted_at: acceptedAt,
    };

    step = 'verify_captcha';
    const captchaResult = await verifyCaptchaToken(captchaToken);
    if (!captchaResult.success) {
      console.warn('Signup captcha verification failed', captchaResult.errors);
      return fail({ error: 'CAPTCHA validation failed, please retry' }, 403);
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return fail({ error: emailValidation.error || 'Invalid email' }, 400);
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      return fail({ error: usernameValidation.error || 'Invalid username' }, 400);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return fail({ error: passwordValidation.error || 'Invalid password' }, 400);
    }

    if (full_name) {
      const nameValidation = validateFullName(full_name);
      if (!nameValidation.isValid) {
        return fail({ error: nameValidation.error || 'Invalid full name' }, 400);
      }
    }

    const safeFullName =
      typeof full_name === 'string' && full_name.trim().length > 0 ? full_name.trim() : username;

    step = 'create_supabase_admin_client';
    const supabase = createSupabaseAdminClient();

    step = 'check_existing_email';
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id, account_status')
      .eq('email', email)
      .neq('account_status', 'deleted')
      .maybeSingle();

    if (existingEmail) {
      console.warn('Signup attempt for already registered email', email);
      return fail({ error: 'An account with this email already exists.' }, 409);
    }

    step = 'check_existing_username';
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id, account_status')
      .eq('username', username)
      .neq('account_status', 'deleted')
      .maybeSingle();

    if (existingUsername) {
      console.warn('Signup attempt with existing username', username);
      return fail({ error: 'Username is already in use.' }, 409);
    }

    step = 'create_auth_user';
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        username,
        full_name: safeFullName,
        legal_acceptance: legalAcceptance,
      },
    });

    if (authError) {
      console.error('Admin create user error:', authError);
      if (authError.message.toLowerCase().includes('already')) {
        return fail({ error: 'An account with these details already exists.' }, 409);
      }
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    const createdUser = authData.user;
    if (!createdUser) {
      console.error('Admin create user returned no user object');
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    step = 'upsert_user_profile';
    const { error: updateError } = await supabase
      .from('users')
      .upsert(
        {
          id: createdUser.id,
          email,
          username,
          full_name: safeFullName,
          display_name: safeFullName,
          date_of_birth: date_of_birth || null,
          country: country || null,
          bio: bio || null,
          steam_id: steam_id || null,
          privacy_settings: {
            legal_acceptance: legalAcceptance,
          },
        },
        { onConflict: 'id' },
      )
      .select('id')
      .single();

    if (updateError) {
      console.error('Profile upsert error:', updateError);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    step = 'generate_signup_link';
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        redirectTo: `${siteUrl}/auth/confirm-email?state=success`,
      },
    });

    const actionLink = linkData?.properties?.action_link;
    if (linkError || !actionLink) {
      console.error('Signup link generation failed:', linkError);
      return fail(
        {
          error: 'Account created, but confirmation email was not sent. Try again.',
        },
        500,
      );
    }

    try {
      step = 'send_confirmation_email';
      await sendConfirmEmail(email, actionLink);
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      return fail({ error: 'We could not send the confirmation email. Try again shortly.' }, 500);
    }

    step = 'complete';
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Signup handler error:', { step, error });
    if (process.env.NODE_ENV === 'development') {
      const message = error instanceof Error ? error.message : 'Unknown signup error';
      return fail({ error: `Signup failed at step "${step}": ${message}` }, 500);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const POST = withApiRoute(POSTHandler);
