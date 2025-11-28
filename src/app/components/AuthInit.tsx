'use client';

/**
 * AuthInit Component
 * Initializes authentication state on app mount
 * PH-30: User Authentication System
 */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchSession, setUser } from '@/store/slices/authSlice';
import { supabase } from '@/lib/supabase-client';
import type { AppDispatch } from '@/store/store';

export default function AuthInit() {
  const dispatch = useDispatch<AppDispatch>();

  // Fetch session on mount
  useEffect(() => {
    dispatch(fetchSession());

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session || event === 'SIGNED_OUT') {
        dispatch(setUser(null));
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        dispatch(fetchSession());
      }
    });

    return () => {
      subscription?.subscription?.unsubscribe();
    };
  }, [dispatch]);

  // This component doesn't render anything
  return null;
}
