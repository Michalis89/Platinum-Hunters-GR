import { createMediaSearchRoute } from '@/lib/api/media/factories';
import { moviesSearchConfig } from '@/lib/api/media/search/providers/movies';

export const { GET } = createMediaSearchRoute(moviesSearchConfig);
