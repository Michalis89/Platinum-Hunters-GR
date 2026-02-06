import { createSuggestionsRoute } from '@/lib/api/media/factories';
import { booksSuggestionsConfig } from '@/lib/api/media/suggestionsConfigs';

export const { GET } = createSuggestionsRoute(booksSuggestionsConfig);
