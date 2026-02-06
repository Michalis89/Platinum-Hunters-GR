import { createMediaSearchRoute } from '@/lib/api/media/factories';
import { animeSearchConfig } from '@/lib/api/media/search/providers/anime';

export const { GET } = createMediaSearchRoute(animeSearchConfig);
