'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

type TicketNotificationSummary = {
  unread_count: number;
  user_unread_count: number;
  admin_unread_count: number;
  enabled: boolean;
};

export function useTicketNotificationCount(enabled: boolean, intervalMs = 30000) {
  const [summary, setSummary] = useState<TicketNotificationSummary>({
    unread_count: 0,
    user_unread_count: 0,
    admin_unread_count: 0,
    enabled,
  });

  const load = useCallback(async () => {
    if (!enabled) {
      setSummary({
        unread_count: 0,
        user_unread_count: 0,
        admin_unread_count: 0,
        enabled: false,
      });
      return;
    }

    try {
      const response = await fetch('/api/notifications/tickets/summary');
      const payload = (await response.json().catch(() => null)) as
        | { data?: TicketNotificationSummary }
        | null;

      if (!response.ok) {
        setSummary({
          unread_count: 0,
          user_unread_count: 0,
          admin_unread_count: 0,
          enabled: true,
        });
        return;
      }

      setSummary({
        unread_count: payload?.data?.unread_count ?? 0,
        user_unread_count: payload?.data?.user_unread_count ?? 0,
        admin_unread_count: payload?.data?.admin_unread_count ?? 0,
        enabled: payload?.data?.enabled ?? true,
      });
    } catch {
      setSummary({
        unread_count: 0,
        user_unread_count: 0,
        admin_unread_count: 0,
        enabled,
      });
    }
  }, [enabled]);

  useEffect(() => {
    void load();

    if (!enabled) {
      return;
    }

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
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [enabled, intervalMs, load]);

  return {
    count: summary.unread_count,
    userCount: summary.user_unread_count,
    adminCount: summary.admin_unread_count,
    totalCount: summary.unread_count,
    refresh: load,
  };
}
