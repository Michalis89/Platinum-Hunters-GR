import { EXTERNAL_API_REVALIDATE_SECONDS } from '@/lib/constants/cache';
import { cachedExternalFetch } from '@/lib/api-cache/external';

export type TmdbCreditCategory = 'movies' | 'tv';

type TmdbCreditsResponse = {
  cast?: Array<{ name?: string | null; order?: number | null } | null> | null;
  crew?: Array<{
    name?: string | null;
    job?: string | null;
    department?: string | null;
  } | null> | null;
};

type TmdbCreditsResult = {
  directors: string[];
  actors: string[];
};

const getTmdbApiKey = () => process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || '';

const toUniqueNames = (values: Array<string | null | undefined>, limit: number) =>
  Array.from(
    new Set(values.map(value => (typeof value === 'string' ? value.trim() : '')).filter(Boolean)),
  ).slice(0, limit);

export async function fetchTmdbCredits(
  category: TmdbCreditCategory,
  tmdbId: number,
): Promise<TmdbCreditsResult> {
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
    throw new Error('Invalid tmdb_id');
  }
  if (category !== 'movies' && category !== 'tv') {
    throw new Error('Unsupported category');
  }

  const apiKey = getTmdbApiKey();
  if (!apiKey) {
    throw new Error('Missing TMDB API key');
  }

  const base = category === 'movies' ? 'movie' : 'tv';
  const url = new URL(`https://api.themoviedb.org/3/${base}/${tmdbId}/credits`);
  url.searchParams.set('api_key', apiKey);

  const data = await cachedExternalFetch<TmdbCreditsResponse>({
    apiName: `tmdb-credits-${category}`,
    endpoint: url.toString(),
    ttlSeconds: EXTERNAL_API_REVALIDATE_SECONDS,
  });

  const crew = Array.isArray(data.crew) ? data.crew : [];
  const cast = Array.isArray(data.cast) ? data.cast : [];

  const directors = toUniqueNames(
    crew
      .filter(member => {
        const department = member?.department?.toLowerCase() ?? '';
        const job = member?.job?.toLowerCase() ?? '';
        return department === 'directing' || job === 'director';
      })
      .map(member => member?.name),
    5,
  );

  const actors = toUniqueNames(
    cast
      .slice()
      .sort((a, b) => (a?.order ?? Number.MAX_SAFE_INTEGER) - (b?.order ?? Number.MAX_SAFE_INTEGER))
      .map(member => member?.name),
    8,
  );

  return { directors, actors };
}
