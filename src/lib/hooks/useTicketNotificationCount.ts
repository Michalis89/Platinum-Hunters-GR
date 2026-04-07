'use client';

import { useTicketNotifications } from '@/context/TicketNotificationContext';

/**
 * Thin wrapper around TicketNotificationContext.
 * The singleton provider in AppShell owns the single Realtime subscription
 * and polling interval — this hook just reads the shared state.
 */
export function useTicketNotificationCount() {
  return useTicketNotifications();
}
