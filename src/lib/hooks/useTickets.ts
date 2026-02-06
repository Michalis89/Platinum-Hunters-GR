'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type TicketMeta = {
  total: number;
  limit: number;
  offset: number;
};

export type TicketsAlert = {
  type: 'success' | 'error' | 'warning';
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

type UseTicketsOptions<TTicket, TFilters extends Record<string, string>> = {
  endpoint: string;
  enabled?: boolean;
  initialFilters?: TFilters;
  errorMessage?: string;
  buildQueryParams?: (filters: TFilters) => URLSearchParams;
  mapData?: (payload: unknown) => TTicket[];
  mapMeta?: (payload: unknown) => TicketMeta | null;
};

type UseTicketsResult<TTicket, TFilters extends Record<string, string>> = {
  tickets: TTicket[];
  setTickets: Dispatch<SetStateAction<TTicket[]>>;
  loading: boolean;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  filters: TFilters;
  setFilters: Dispatch<SetStateAction<TFilters>>;
  meta: TicketMeta | null;
  actionLoading: string | null;
  setActionLoading: Dispatch<SetStateAction<string | null>>;
  alert: TicketsAlert | null;
  setAlert: Dispatch<SetStateAction<TicketsAlert | null>>;
  reload: () => Promise<void>;
};

const defaultQueryBuilder = <TFilters extends Record<string, string>>(filters: TFilters) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }
  return params;
};

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const candidate = payload.error;
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }
  return fallback;
};

const defaultMapData = <TTicket,>(payload: unknown): TTicket[] => {
  if (payload && typeof payload === 'object' && 'data' in payload && Array.isArray(payload.data)) {
    return payload.data as TTicket[];
  }
  return [];
};

const defaultMapMeta = (payload: unknown): TicketMeta | null => {
  if (
    payload &&
    typeof payload === 'object' &&
    'meta' in payload &&
    payload.meta &&
    typeof payload.meta === 'object'
  ) {
    const candidate = payload.meta as Partial<TicketMeta>;
    if (
      typeof candidate.total === 'number' &&
      typeof candidate.limit === 'number' &&
      typeof candidate.offset === 'number'
    ) {
      return {
        total: candidate.total,
        limit: candidate.limit,
        offset: candidate.offset,
      };
    }
  }
  return null;
};

export function useTickets<TTicket, TFilters extends Record<string, string> = Record<string, never>>(
  options: UseTicketsOptions<TTicket, TFilters>,
): UseTicketsResult<TTicket, TFilters> {
  const {
    endpoint,
    enabled = true,
    initialFilters,
    errorMessage = 'Κάτι πήγε στραβά',
    buildQueryParams = defaultQueryBuilder,
    mapData = defaultMapData<TTicket>,
    mapMeta = defaultMapMeta,
  } = options;

  const [tickets, setTickets] = useState<TTicket[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<TicketMeta | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [alert, setAlert] = useState<TicketsAlert | null>(null);
  const [filters, setFilters] = useState<TFilters>(() => (initialFilters ?? ({} as TFilters)));

  const queryString = useMemo(() => buildQueryParams(filters).toString(), [buildQueryParams, filters]);

  const loadTickets = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      const response = await fetch(url);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, errorMessage));
      }

      setTickets(mapData(payload));
      setMeta(mapMeta(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setLoading(false);
    }
  }, [enabled, endpoint, errorMessage, mapData, mapMeta, queryString]);

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      if (!enabled) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        const response = await fetch(url);
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(getErrorMessage(payload, errorMessage));
        }

        if (!ignore) {
          setTickets(mapData(payload));
          setMeta(mapMeta(payload));
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : errorMessage);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      ignore = true;
    };
  }, [enabled, endpoint, errorMessage, mapData, mapMeta, queryString]);

  return {
    tickets,
    setTickets,
    loading,
    error,
    setError,
    filters,
    setFilters,
    meta,
    actionLoading,
    setActionLoading,
    alert,
    setAlert,
    reload: loadTickets,
  };
}
