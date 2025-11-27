/**
 * Logout API Route
 * POST /api/auth/logout
 * PH-30: User Authentication System
 */

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const supabase = await createRouteHandlerClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return NextResponse.json({ error: 'Σφάλμα αποσύνδεσης' }, { status: 500 });
    }

    // Clear session cookies
    const cookieStore = await cookies();
    cookieStore.delete('sb-access-token');
    cookieStore.delete('sb-refresh-token');

    return NextResponse.json({
      message: 'Επιτυχής αποσύνδεση',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Σφάλμα αποσύνδεσης' }, { status: 500 });
  }
}
