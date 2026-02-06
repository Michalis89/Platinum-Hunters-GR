import { createSuggestionsRoute } from '@/lib/api/media/factories';
import { moviesSuggestionsConfig } from '@/lib/api/media/suggestionsConfigs';

export const { GET } = createSuggestionsRoute(moviesSuggestionsConfig);
