import { createMediaSearchRoute } from '@/lib/api/media/factories';
import { gamesSearchConfig } from '@/lib/api/media/search/providers/games';

export const { GET } = createMediaSearchRoute(gamesSearchConfig);
