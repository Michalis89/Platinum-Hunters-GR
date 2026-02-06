/**
 * useFetch Hook
 * Generic data fetching hook with loading, error state, and cleanup
 */

import { useEffect, useState, useCallback } from 'react';

export type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export type UseFetchOptions = {
  skip?: boolean;
};

/**
 * Generic fetch hook for client-side data fetching
 * Handles loading states, errors, and cleanup automatically
 *
 * @param url - The URL to fetch from (or null to skip)
 * @param options - Optional configuration
 * @returns FetchState with data, loading, error, and refetch function
 *
 * @example
 * const { data, loading, error, refetch } = useFetch<Ticket[]>('/api/tickets');
 */
export function useFetch<T>(url: string | null, options?: UseFetchOptions): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options?.skip);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      if (!url || options?.skip) {
        if (!signal?.aborted) {
          setLoading(false);
        }
        return;
      }

      if (!signal?.aborted) {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await fetch(url, { signal });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || 'Î‘Ï€Î¿Ï„Ï…Ï‡Î¯Î± Ï†ÏŒÏÏ„Ï‰ÏƒÎ·Ï‚ Î´ÎµÎ´Î¿Î¼Î­Î½Ï‰Î½');
        }

        const payload = await response.json();
        const result = payload.data ?? payload;

        if (!signal?.aborted) {
          setData(result);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'ÎšÎ¬Ï„Î¹ Ï€Î®Î³Îµ ÏƒÏ„ÏÎ±Î²Î¬';
        if (!signal?.aborted) {
          setError(errorMessage);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [url, options?.skip],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchData(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      void fetchData();
    },
  };
}
