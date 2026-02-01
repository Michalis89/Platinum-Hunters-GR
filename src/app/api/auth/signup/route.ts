import { withApiRoute } from '@/lib/observability/withApiRoute';

import { NextResponse } from 'next/server';

import { API_ERRORS } from '@/lib/api/errors';
import { fail } from '@/lib/api/response';
import { rateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit';
import { verifyCaptchaToken } from '@/lib/captcha/turnstile';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendConfirmEmail } from '@/lib/email/send';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validateFullName,
  validateDateOfBirth,
  validatePSNId,
  validateBio,
} from '@/utils/validation/auth';

/**
 * Signup API route that creates a Supabase user via the Admin API and
 * ships a Resend confirmation email with the Supabase action link.
 */
async function POSTHandler(req: Request) {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) {
    console.error('Missing SITE_URL environment variable for signup flow');
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }

  const clientIp = getClientIp(req);
  const rateLimitResult = rateLimit(`register:${clientIp}`, RATE_LIMITS.register);
  if (!rateLimitResult.success) {
    return fail({ error: 'Πολλές προσπάθειες εγγραφής. Δοκιμάστε ξανά αργότερα.' }, 429, {
      headers: rateLimitHeaders(rateLimitResult),
    });
  }

  try {
    const body = await req.json();
    const {
      email,
      password,
      username,
      full_name,
      date_of_birth,
      country,
      bio,
      psn_id,
      xbox_gamertag,
      steam_id,
      nintendo_id,
      favorite_platform,
      favorite_genres,
      gaming_since,
      categories,
      favorite_anime_genres,
      favorite_movie_genres,
      favorite_book_genres,
      favorite_languages,
      pet_types,
      vape_device,
      vape_flavor,
      captchaToken,
    } = body;

    const captchaResult = await verifyCaptchaToken(captchaToken);
    if (!captchaResult.success) {
      return fail({ error: 'CAPTCHA validation failed, please retry' }, 403);
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return fail({ error: emailValidation.error || 'Μη έγκυρο email' }, 400);
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      return fail({ error: usernameValidation.error || 'Μη έγκυρο username' }, 400);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return fail({ error: passwordValidation.error || 'Μη έγκυρος κωδικός' }, 400);
    }

    const nameValidation = validateFullName(full_name);
    if (!nameValidation.isValid) {
      return fail({ error: nameValidation.error || 'Μη έγκυρο ονοματεπώνυμο' }, 400);
    }

    const dobValidation = validateDateOfBirth(date_of_birth);
    if (!dobValidation.isValid) {
      return fail({ error: dobValidation.error || 'Μη έγκυρη ημερομηνία γέννησης' }, 400);
    }

    if (psn_id) {
      const psnValidation = validatePSNId(psn_id);
      if (!psnValidation.isValid) {
        return fail({ error: psnValidation.error || 'Μη έγκυρο PSN ID' }, 400);
      }
    }

    if (bio) {
      const bioValidation = validateBio(bio);
      if (!bioValidation.isValid) {
        return fail({ error: bioValidation.error || 'Μη έγκυρο bio' }, 400);
      }
    }

    const supabase = createSupabaseAdminClient();

    const { data: existingEmail } = await supabase
      .from('users')
      .select('id, account_status')
      .eq('email', email)
      .neq('account_status', 'deleted')
      .maybeSingle();

    if (existingEmail) {
      console.info('Signup attempt for already registered email', email);
      return NextResponse.json({ ok: true });
    }

    const { data: existingUsername } = await supabase
      .from('users')
      .select('id, account_status')
      .eq('username', username)
      .neq('account_status', 'deleted')
      .maybeSingle();

    if (existingUsername) {
      console.info('Signup attempt with existing username', username);
      return NextResponse.json({ ok: true });
    }

    if (psn_id) {
      const { data: existingPSN } = await supabase
        .from('users')
        .select('id')
        .eq('psn_id', psn_id)
        .maybeSingle();

      if (existingPSN) {
        console.info('Signup attempt with existing PSN ID', psn_id);
        return NextResponse.json({ ok: true });
      }
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        username,
        full_name,
      },
    });

    if (authError) {
      console.error('Admin create user error:', authError);
      return NextResponse.json({ ok: true });
    }

    const createdUser = authData.user;
    if (!createdUser) {
      console.error('Admin create user returned no user object');
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        username,
        full_name,
        display_name: full_name,
        date_of_birth,
        country,
        bio: bio || null,
        psn_id: psn_id || null,
        xbox_gamertag: xbox_gamertag || null,
        steam_id: steam_id || null,
        nintendo_id: nintendo_id || null,
        favorite_platform: favorite_platform || null,
        favorite_genres: favorite_genres || null,
        gaming_since: gaming_since || null,
        categories: categories || null,
        favorite_anime_genres: favorite_anime_genres || null,
        favorite_movie_genres: favorite_movie_genres || null,
        favorite_book_genres: favorite_book_genres || null,
        favorite_languages: favorite_languages || null,
        pet_types: pet_types || null,
        vape_device: vape_device || null,
        vape_flavor: vape_flavor || null,
      })
      .eq('id', createdUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
    }

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        redirectTo: `${siteUrl}/pages/auth/confirm-email`,
      },
    });

    const actionLink = linkData?.properties?.action_link;
    if (linkError || !actionLink) {
      console.error('Signup link generation failed:', linkError);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    try {
      await sendConfirmEmail(email, actionLink);
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Signup handler error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

export const POST = withApiRoute(POSTHandler);
