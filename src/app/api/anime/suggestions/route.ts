import { createSuggestionsRoute } from '@/lib/api/media/factories';
import { animeSuggestionsConfig } from '@/lib/api/media/suggestionsConfigs';

export const { GET } = createSuggestionsRoute(animeSuggestionsConfig);
