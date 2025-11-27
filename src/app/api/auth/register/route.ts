/**
 * Register API Route
 * POST /api/auth/register
 * PH-30: User Authentication System
 */

import { NextResponse } from 'next/server';
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

export async function POST(req: Request) {
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
    } = body;

    // =====================================================
    // VALIDATION
    // =====================================================

    // Required fields
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      return NextResponse.json({ error: usernameValidation.error }, { status: 400 });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
    }

    const nameValidation = validateFullName(full_name);
    if (!nameValidation.isValid) {
      return NextResponse.json({ error: nameValidation.error }, { status: 400 });
    }

    const dobValidation = validateDateOfBirth(date_of_birth);
    if (!dobValidation.isValid) {
      return NextResponse.json({ error: dobValidation.error }, { status: 400 });
    }

    // Optional fields
    if (psn_id) {
      const psnValidation = validatePSNId(psn_id);
      if (!psnValidation.isValid) {
        return NextResponse.json({ error: psnValidation.error }, { status: 400 });
      }
    }

    if (bio) {
      const bioValidation = validateBio(bio);
      if (!bioValidation.isValid) {
        return NextResponse.json({ error: bioValidation.error }, { status: 400 });
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
      return NextResponse.json(
        { error: 'Αυτό το email χρησιμοποιείται ήδη' },
        { status: 409 },
      );
    }

    // Check if username exists (exclude deleted accounts)
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id, account_status')
      .eq('username', username)
      .neq('account_status', 'deleted')
      .maybeSingle();

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Αυτό το username χρησιμοποιείται ήδη' },
        { status: 409 },
      );
    }

    // Check if PSN ID exists (if provided)
    if (psn_id) {
      const { data: existingPSN } = await supabase
        .from('users')
        .select('id')
        .eq('psn_id', psn_id)
        .maybeSingle();

      if (existingPSN) {
        return NextResponse.json(
          { error: 'Αυτό το PSN ID χρησιμοποιείται ήδη' },
          { status: 409 },
        );
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
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Αποτυχία δημιουργίας χρήστη' }, { status: 500 });
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

    return NextResponse.json({
      user: updatedUser || authData.user,
      session: authData.session,
      message: 'Ο λογαριασμός δημιουργήθηκε επιτυχώς! Ελέγξτε το email σας για επιβεβαίωση.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Σφάλμα εγγραφής' }, { status: 500 });
  }
}
