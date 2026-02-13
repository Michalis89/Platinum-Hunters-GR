import useSWRImmutable from 'swr';
import type { UserSettingsData } from './types';

const fetcher = async (url: string) => {
  const response = await fetch(url, { method: 'GET', credentials: 'include' });
  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error ?? 'Failed to load user settings';
    throw new Error(message);
  }

  return payload.data as UserSettingsData;
};

export function useUserSettings(enabled: boolean) {
  const { data, error, mutate } = useSWRImmutable<UserSettingsData>(
    enabled ? '/api/settings' : null,
    fetcher,
  );

  return {
    settings: data ?? null,
    isLoading: enabled && !data && !error,
    isError: error,
    mutate,
  };
}
