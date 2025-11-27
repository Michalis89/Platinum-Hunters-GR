'use client';

/**
 * AuthInit Component
 * Initializes authentication state on app mount
 * PH-30: User Authentication System
 */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchSession } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';

export default function AuthInit() {
  const dispatch = useDispatch<AppDispatch>();

  // Fetch session on mount
  useEffect(() => {
    dispatch(fetchSession());
  }, [dispatch]);

  // This component doesn't render anything
  return null;
}
