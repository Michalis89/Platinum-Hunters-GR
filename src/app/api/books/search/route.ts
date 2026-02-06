import { createMediaSearchRoute } from '@/lib/api/media/factories';
import { booksSearchConfig } from '@/lib/api/media/search/providers/books';

export const { GET } = createMediaSearchRoute(booksSearchConfig);
