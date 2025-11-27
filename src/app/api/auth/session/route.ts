/**
 * Session API Route
 * GET /api/auth/session
 * PH-30: User Authentication System
 */

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Σφάλμα ελέγχου session' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ user: null, session: null });
    }

    // Fetch user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Σφάλμα φόρτωσης προφίλ' }, { status: 500 });
    }

    // Check if account is deleted, suspended, or banned
    if (userProfile.account_status === 'deleted') {
      // Sign out the user and clear cookies
      await supabase.auth.signOut();

      // Clear session cookies
      const cookieStore = await cookies();
      cookieStore.delete('sb-access-token');
      cookieStore.delete('sb-refresh-token');

      return NextResponse.json({ user: null, session: null });
    }

    if (userProfile.account_status === 'suspended' || userProfile.account_status === 'banned') {
      // Sign out suspended/banned users
      await supabase.auth.signOut();

      // Clear session cookies
      const cookieStore = await cookies();
      cookieStore.delete('sb-access-token');
      cookieStore.delete('sb-refresh-token');

      return NextResponse.json({
        error: userProfile.account_status === 'suspended'
          ? 'Ο λογαριασμός σας έχει ανασταλεί'
          : 'Ο λογαριασμός σας έχει αποκλειστεί',
        user: null,
        session: null
      }, { status: 403 });
    }

    return NextResponse.json({
      user: userProfile,
      session,
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Σφάλμα ελέγχου session' }, { status: 500 });
  }
}
