import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export const parseError = (error: unknown): string => {
  if (typeof error === 'string') return error;

  if ((error as FetchBaseQueryError)?.data) {
    const data = (error as FetchBaseQueryError).data as { error?: string };
    if (data?.error) return data.error;
    return JSON.stringify(data);
  }

  if ((error as FetchBaseQueryError)?.status) {
    return `Σφάλμα: ${(error as FetchBaseQueryError).status}`;
  }

  return 'Άγνωστο σφάλμα';
};
