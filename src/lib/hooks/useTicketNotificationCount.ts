'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

type TicketNotificationSummary = {
  unread_count: number;
  enabled: boolean;
};

export function useTicketNotificationCount(enabled: boolean, intervalMs = 30000) {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (!enabled) {
      setCount(0);
      return;
    }

    try {
      const response = await fetch('/api/notifications/tickets/summary');
      const payload = (await response.json().catch(() => null)) as
        | { data?: TicketNotificationSummary }
        | null;

      if (!response.ok) {
        setCount(0);
        return;
      }

      setCount(payload?.data?.unread_count ?? 0);
    } catch {
      setCount(0);
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

  return { count, refresh: load };
}
