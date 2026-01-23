'use client';

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, setUser } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';
import { supabase } from '@/lib/supabase-client';

const PING_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes to stay within 5m window

export default function HeartbeatPing() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let aborted = false;

    const ping = () => {
      supabase.auth.getSession().then(({ data }) => {
        if (aborted) return;
        const token = data.session?.access_token;
        if (!token) return;

        fetch('/api/activity/heartbeat', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => {
            if (res.status === 401) {
              // double-check session before clearing state to avoid flicker
              supabase.auth.getSession().then(({ data: refreshed }) => {
                if (aborted) return;
                if (!refreshed.session) {
                  dispatch(setUser(null));
                }
              });
            }
          })
          .catch(() => {});
      });
    };

    // initial ping
    ping();

    const id = setInterval(() => {
      if (!aborted) ping();
    }, PING_INTERVAL_MS);

    return () => {
      aborted = true;
      clearInterval(id);
    };
  }, [isAuthenticated, dispatch]);

  return null;
}
