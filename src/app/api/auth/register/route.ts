/**
 * Register API Route
 * POST /api/auth/register
 * PH-30: User Authentication System
 */

import getSupabaseServer from '@/lib/supabase-server';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validateFullName,
  validateDateOfBirth,
  validatePSNId,
  validateBio,
} from '@/utils/validation/auth';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';
import { rateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(req: Request) {
  // Rate limiting: 3 registration attempts per hour per IP
  const clientIp = getClientIp(req);
  const rateLimitResult = rateLimit(`register:${clientIp}`, RATE_LIMITS.register);

  if (!rateLimitResult.success) {
    return fail(
      { error: 'Πολλές προσπάθειες εγγραφής. Δοκιμάστε ξανά αργότερα.' },
      429,
      { headers: rateLimitHeaders(rateLimitResult) },
    );
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
    } = body;

    // =====================================================
    // VALIDATION
    // =====================================================

    // Required fields
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

    // Optional fields
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

    // =====================================================
    // CHECK UNIQUENESS
    // =====================================================

    const supabase = getSupabaseServer();

    // Check if email exists (exclude deleted accounts)
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id, account_status')
      .eq('email', email)
      .neq('account_status', 'deleted')
      .maybeSingle();

    if (existingEmail) {
      return fail({ error: 'Αυτό το email χρησιμοποιείται ήδη', code: 'CONFLICT' }, 409);
    }

    // Check if username exists (exclude deleted accounts)
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id, account_status')
      .eq('username', username)
      .neq('account_status', 'deleted')
      .maybeSingle();

    if (existingUsername) {
      return fail({ error: 'Αυτό το username χρησιμοποιείται ήδη', code: 'CONFLICT' }, 409);
    }

    // Check if PSN ID exists (if provided)
    if (psn_id) {
      const { data: existingPSN } = await supabase
        .from('users')
        .select('id')
        .eq('psn_id', psn_id)
        .maybeSingle();

      if (existingPSN) {
        return fail({ error: 'Αυτό το PSN ID χρησιμοποιείται ήδη', code: 'CONFLICT' }, 409);
      }
    }

    // =====================================================
    // CREATE AUTH USER
    // =====================================================

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name,
        },
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return fail({ error: authError.message }, 400);
    }

    if (!authData.user) {
      return fail({ error: 'Αποτυχία δημιουργίας χρήστη' }, 500);
    }

    // =====================================================
    // UPDATE PUBLIC USER PROFILE
    // =====================================================
    // The trigger created the basic record, now we update it with full details

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        username, // Update from email prefix to actual username
        full_name,
        display_name: full_name, // Use full name as display name initially
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
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      // Don't fail the registration, user can update later
    }

    // =====================================================
    // RETURN SUCCESS
    // =====================================================

    return ok({
      user: updatedUser || authData.user,
      session: authData.session,
      message: 'Ο λογαριασμός δημιουργήθηκε επιτυχώς! Ελέγξτε το email σας για επιβεβαίωση.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}
