const RAWG_API_BASE = 'https://api.rawg.io/api';

export type RawgGame = {
  id: number;
  name: string;
  slug: string;
  playtime: number | null;
  metacritic: number | null;
  rating: number | null;
  platforms?: Array<{
    platform: {
      id: number | null;
      name: string | null;
      slug: string | null;
    } | null;
  }> | null;
  genres?: Array<{
    name: string | null;
    slug: string | null;
  }> | null;
  tags?: Array<{
    name: string | null;
    slug: string | null;
  }> | null;
};

type FetchGamesParams = {
  genres?: string[];
  platforms?: number[];
  minMetacritic?: number;
  ordering?: string;
  pageSize?: number;
};

export class RawgClient {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('RAWG API key is required');
    }
    this.apiKey = apiKey;
  }

  async fetchGames(params: FetchGamesParams): Promise<RawgGame[]> {
    const search = new URLSearchParams();
    search.set('key', this.apiKey);
    search.set('ordering', params.ordering ?? '-rating');
    search.set('page_size', String(params.pageSize ?? 40));

    if (params.genres && params.genres.length > 0) {
      search.set('genres', params.genres.join(','));
    }
    if (params.platforms && params.platforms.length > 0) {
      search.set('platforms', params.platforms.join(','));
    }
    if (params.minMetacritic) {
      search.set('metacritic', String(params.minMetacritic));
    }

    const url = `${RAWG_API_BASE}/games?${search.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`RAWG fetch failed: ${response.status}`);
    }

    const payload = (await response.json()) as { results?: RawgGame[] };
    if (!payload.results) {
      return [];
    }

    return payload.results;
  }
}
