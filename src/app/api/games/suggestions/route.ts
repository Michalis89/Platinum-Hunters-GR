import { createSuggestionsRoute } from '@/lib/api/media/factories';
import { gamesSuggestionsConfig } from '@/lib/api/media/suggestionsConfigs';

export const { GET } = createSuggestionsRoute(gamesSuggestionsConfig);
