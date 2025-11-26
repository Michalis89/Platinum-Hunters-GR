import useSWR from 'swr';
import { ProcessedGame } from '@/types/interfaces';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useGame(slug: string | null) {
  const { data, error, isLoading } = useSWR<ProcessedGame>(
    slug ? `/api/games/${slug}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache for 1 minute
    },
  );

  return {
    game: data,
    isLoading,
    isError: error,
  };
}
