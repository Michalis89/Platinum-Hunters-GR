import type { MediaCategoryKey } from '../config';
import { revalidateCache } from '@/lib/cache/tags';

function getLibraryTypeForCategoryKey(
  key: MediaCategoryKey,
): 'anime' | 'books' | 'movies' | null {
  if (key === 'anime') {
    return 'anime';
  }
  if (key === 'books') {
    return 'books';
  }
  if (key === 'movies') {
    return 'movies';
  }
  return null;
}

export function revalidateUserMediaMutation(userId: string, key: MediaCategoryKey): void {
  revalidateCache.userBacklog(userId);

  const libraryType = getLibraryTypeForCategoryKey(key);
  if (libraryType) {
    revalidateCache.userLibrary(userId, libraryType);
  }

  // Dashboard uses server-rendered sections with cached route payloads.
  // Revalidate after each library mutation so recommendations refresh on next visit.
  revalidateCache.path('/dashboard');
}

