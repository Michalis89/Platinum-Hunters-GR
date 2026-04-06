'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

type TicketNotificationSummary = {
  unread_count: number;
  user_unread_count: number;
  admin_unread_count: number;
};

export function useTicketNotificationCount(enabled: boolean, intervalMs = 30000) {
  const inFlightControllerRef = useRef<AbortController | null>(null);
  const [summary, setSummary] = useState<TicketNotificationSummary>({
    unread_count: 0,
    user_unread_count: 0,
    admin_unread_count: 0,
  });

  const load = useCallback(async () => {
    if (!enabled) {
      inFlightControllerRef.current?.abort();
      return;
    }

    inFlightControllerRef.current?.abort();
    const controller = new AbortController();
    inFlightControllerRef.current = controller;

    try {
      const response = await fetch('/api/notifications/tickets/summary', {
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as {
        data?: TicketNotificationSummary;
      } | null;

      if (!response.ok) {
        setSummary({
          unread_count: 0,
          user_unread_count: 0,
          admin_unread_count: 0,
        });
        return;
      }

      setSummary({
        unread_count: payload?.data?.unread_count ?? 0,
        user_unread_count: payload?.data?.user_unread_count ?? 0,
        admin_unread_count: payload?.data?.admin_unread_count ?? 0,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setSummary({
        unread_count: 0,
        user_unread_count: 0,
        admin_unread_count: 0,
      });
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      inFlightControllerRef.current?.abort();
      return;
    }

    const initialLoadTimer = window.setTimeout(() => {
      void load();
    }, 0);

    const channel = supabase
      .channel(`ticket-notifications-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        () => void load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_messages' },
        () => void load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_ticket_reads' },
        () => void load(),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_settings' },
        () => void load(),
      )
      .subscribe();

    const fallbackInterval = intervalMs > 0 ? intervalMs : 120000;
    const timer = window.setInterval(() => {
      void load();
    }, fallbackInterval);

    return () => {
      window.clearTimeout(initialLoadTimer);
      window.clearInterval(timer);
      inFlightControllerRef.current?.abort();
      void supabase.removeChannel(channel);
    };
  }, [enabled, intervalMs, load]);

  return {
    count: enabled ? summary.unread_count : 0,
    userCount: enabled ? summary.user_unread_count : 0,
    adminCount: enabled ? summary.admin_unread_count : 0,
    totalCount: enabled ? summary.unread_count : 0,
    refresh: load,
  };
}
