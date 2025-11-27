/**
 * Login API Route
 * POST /api/auth/login
 * PH-30: User Authentication System
 */

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { validateEmail, validatePassword } from '@/utils/validation/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password } = body; // Accept email OR username

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!identifier || identifier.trim() === '') {
      return NextResponse.json({ error: 'Το email ή το username είναι υποχρεωτικό' }, { status: 400 });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
    }

    // =====================================================
    // DETERMINE IF IDENTIFIER IS EMAIL OR USERNAME
    // =====================================================

    const supabase = await createRouteHandlerClient();
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
        return NextResponse.json({ error: 'Σφάλμα σύνδεσης' }, { status: 500 });
      }

      if (!userData) {
        return NextResponse.json({ error: 'Λάθος username ή κωδικός' }, { status: 401 });
      }

      // Check if account is deleted, suspended, or banned
      if (userData.account_status === 'deleted') {
        return NextResponse.json({ error: 'Ο λογαριασμός έχει διαγραφεί' }, { status: 403 });
      }

      if (userData.account_status === 'suspended') {
        return NextResponse.json(
          { error: 'Ο λογαριασμός σας έχει ανασταλεί. Επικοινωνήστε με τη διαχείριση.' },
          { status: 403 },
        );
      }

      if (userData.account_status === 'banned') {
        return NextResponse.json({ error: 'Ο λογαριασμός σας έχει αποκλειστεί.' }, { status: 403 });
      }

      email = userData.email;
    } else {
      // Validate email format
      const emailValidation = validateEmail(identifier);
      if (!emailValidation.isValid) {
        return NextResponse.json({ error: emailValidation.error }, { status: 400 });
      }
    }

    // =====================================================
    // SIGN IN
    // =====================================================

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Login error:', authError);

      // Check if email is not confirmed
      if (authError.message === 'Email not confirmed') {
        return NextResponse.json(
          { error: 'Το email σου δεν έχει επιβεβαιωθεί. Έλεγξε το email σου και κάνε κλικ στο link επιβεβαίωσης.' },
          { status: 401 },
        );
      }

      return NextResponse.json(
        { error: 'Λάθος email ή κωδικός' },
        { status: 401 },
      );
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Αποτυχία σύνδεσης' }, { status: 500 });
    }

    // =====================================================
    // FETCH USER PROFILE
    // =====================================================

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Σφάλμα φόρτωσης προφίλ' }, { status: 500 });
    }

    // Check if account is suspended or banned
    if (userProfile.account_status === 'suspended') {
      return NextResponse.json(
        { error: 'Ο λογαριασμός σας έχει ανασταλεί. Επικοινωνήστε με τη διαχείριση.' },
        { status: 403 },
      );
    }

    if (userProfile.account_status === 'banned') {
      return NextResponse.json(
        { error: 'Ο λογαριασμός σας έχει αποκλειστεί.' },
        { status: 403 },
      );
    }

    // =====================================================
    // UPDATE LAST LOGIN
    // =====================================================

    await supabase.rpc('update_user_last_login', { user_id: authData.user.id });

    // =====================================================
    // SET SESSION COOKIES
    // =====================================================

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

    // =====================================================
    // RETURN SUCCESS
    // =====================================================

    return NextResponse.json({
      user: userProfile,
      session: authData.session,
      message: 'Επιτυχής σύνδεση!',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Σφάλμα σύνδεσης' }, { status: 500 });
  }
}
