/**
 * Delete Account API Route
 * POST /api/auth/delete-account
 * PH-30: User Authentication System
 */

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import getSupabaseServer from '@/lib/supabase-server';

export async function POST() {
  try {
    const supabase = await createRouteHandlerClient();

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Μη εξουσιοδοτημένη πρόσβαση' }, { status: 401 });
    }

    const userId = session.user.id;

    // =====================================================
    // HARD DELETE: Completely remove user

    // =====================================================
    // Mark as deleted and anonymize data
    // This avoids foreign key constraint issues
    const { error: deleteError } = await supabase.from('users').delete().eq('id', userId);

    if (deleteError) {
      console.error('User deletion error:', deleteError);
      return NextResponse.json({ error: 'Σφάλμα διαγραφής λογαριασμού' }, { status: 500 });
    }

    // Delete from auth.users (requires admin privileges)

    const supabaseAdmin = getSupabaseServer();
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('Auth deletion error (continuing):', authDeleteError);
      // Continue anyway - public.users is already anonymized
    }

    // =====================================================
    // SIGN OUT (best effort - don't fail if session doesn't exist)
    // =====================================================

    try {
      await supabase.auth.signOut();
    } catch (signOutError: unknown) {
      // Session might already be invalid - that's okay
      console.log('SignOut warning (continuing anyway):', signOutError);
    }

    return NextResponse.json({
      message: 'Ο λογαριασμός διαγράφηκε επιτυχώς',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Σφάλμα διαγραφής λογαριασμού' }, { status: 500 });
  }
}
