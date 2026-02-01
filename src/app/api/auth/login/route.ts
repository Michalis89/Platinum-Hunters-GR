import { withApiRoute } from '@/lib/observability/withApiRoute';

/**
 * Login API Route
 * POST /api/auth/login
 * PH-30: User Authentication System
 */

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { validateEmail, validatePassword } from '@/utils/validation/auth';
import type { Database } from '@/lib/supabase/database.types';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { rateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit';
import { verifyCaptchaToken } from '@/lib/captcha/turnstile';

async function POSTHandler(req: Request) {
  // Rate limiting: 5 login attempts per 15 minutes per IP
  const clientIp = getClientIp(req);
  const rateLimitResult = rateLimit(`login:${clientIp}`, RATE_LIMITS.login);

  if (!rateLimitResult.success) {
    return fail(
      { error: 'Πολλές προσπάθειες σύνδεσης. Δοκιμάστε ξανά αργότερα.' },
      429,
      { headers: rateLimitHeaders(rateLimitResult) },
    );
  }

  try {
    const body = await req.json();
    const { identifier, password, captchaToken } = body; // Accept email OR username

    const captchaResult = await verifyCaptchaToken(captchaToken);
    if (!captchaResult.success) {
      return fail({ error: 'CAPTCHA validation failed, please retry' }, 403);
    }

    if (!identifier || identifier.trim() === '') {
      return fail({ error: 'Το email ή το username είναι υποχρεωτικό' }, 400);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return fail({ error: passwordValidation.error || 'Μη έγκυρος κωδικός' }, 400);
    }

    const supabase = await createRouteHandlerClient(undefined, { ignoreCookies: true });
    let email = identifier;

    // If identifier doesn't contain @, treat it as username
    if (!identifier.includes('@')) {
      // Look up email from username in public.users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email, account_status')
        .eq('username', identifier)
        .maybeSingle();

      if (userError) {
        console.error('Username lookup error:', userError);
        return fail({ error: 'Σφάλμα σύνδεσης' }, 500);
      }

      if (!userData) {
        return fail({ error: 'Λάθος username ή κωδικός' }, 401);
      }

      const typedUserData = userData as Pick<
        Database['public']['Tables']['users']['Row'],
        'email' | 'account_status'
      >;

      // Check if account is deleted, suspended, or banned
      if (typedUserData.account_status === 'deleted') {
        return fail({ error: 'Ο λογαριασμός έχει διαγραφεί' }, 403);
      }
      if (typedUserData.account_status === 'suspended') {
        return fail(
          { error: 'Ο λογαριασμός σας έχει ανασταλεί. Επικοινωνήστε με τη διαχείριση.' },
          403,
        );
      }
      if (typedUserData.account_status === 'banned') {
        return fail({ error: 'Ο λογαριασμός σας έχει αποκλειστεί.' }, 403);
      }
      email = typedUserData.email;
    } else {
      // Validate email format
      const emailValidation = validateEmail(identifier);
      if (!emailValidation.isValid) {
        return fail({ error: emailValidation.error || 'Μη έγκυρο email' }, 400);
      }
    }

    // SIGN IN
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Login error:', authError);

      // Check if email is not confirmed
      if (authError.message === 'Email not confirmed') {
        return fail(
          {
            error:
              'Το email σου δεν έχει επιβεβαιωθεί. Έλεγξε το email σου και κάνε κλικ στο link επιβεβαίωσης.',
          },
          401,
        );
      }

      return fail({ error: 'Λάθος email ή κωδικός' }, 401);
    }

    if (!authData.user) {
      return fail({ error: 'Αποτυχία σύνδεσης' }, 500);
    }

    const authedSupabase = await createRouteHandlerClient(authData.session?.access_token, {
      ignoreCookies: true,
    });
    const { data: userProfile, error: profileError } = await authedSupabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return fail({ error: 'Σφάλμα φόρτωσης προφίλ' }, 500);
    }

    // Check if account is suspended or banned
    if (userProfile.account_status === 'suspended') {
      return fail(
        { error: 'Ο λογαριασμός σας έχει ανασταλεί. Επικοινωνήστε με τη διαχείριση.' },
        403,
      );
    }
    if (userProfile.account_status === 'banned') {
      return fail({ error: 'Ο λογαριασμός σας έχει αποκλειστεί.' }, 403);
    }

    // UPDATE LAST LOGIN
    await authedSupabase.rpc('update_user_last_login', { user_id: authData.user.id } as never);
    // SET SESSION COOKIES
    if (authData.session) {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const cookieOptions = {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: authData.session.expires_in || 3600,
      };

      // Set access token and refresh token cookies
      cookieStore.set('sb-access-token', authData.session.access_token, cookieOptions);
      cookieStore.set('sb-refresh-token', authData.session.refresh_token, cookieOptions);
    }

    // RETURN SUCCESS
    return ok({
      user: userProfile,
      session: authData.session,
      message: 'Επιτυχής σύνδεση!',
    });
  } catch (error) {
    console.error('Login error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const POST = withApiRoute(POSTHandler);
