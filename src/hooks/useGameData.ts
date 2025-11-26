import useSWR from 'swr';
import { Guide, GameDetails } from '@/types/interfaces';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useGuides(gameId: number | null) {
  const { data, error, isLoading } = useSWR<Guide[]>(
    gameId ? `/api/guides/${gameId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  );

  return {
    guides: data || [],
    isLoading,
    isError: error,
  };
}

export function useGameDetails(gameId: number | null) {
  const { data, error, isLoading, mutate } = useSWR<GameDetails>(
    gameId ? `/api/game-details/${gameId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  );

  return {
    gameDetails: data || null,
    isLoading,
    isError: error,
    mutate, // For manual revalidation
  };
}

export function useTrophies(gameId: number | null) {
  const { data, error, isLoading } = useSWR<{
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  }>(
    gameId ? `/api/game/${gameId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  );

  return {
    trophies: data || null,
    isLoading,
    isError: error,
  };
}
