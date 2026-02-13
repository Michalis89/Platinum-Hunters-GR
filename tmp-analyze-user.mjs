import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
  envFile
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => line.split('=', 2))
    .map(([key, ...rest]) => [key.trim(), rest.join('=').trim()]),
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing Supabase config');
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

const NOW = new Date('2026-02-12T00:00:00Z');
const MS_IN_DAY = 24 * 60 * 60 * 1000;
const last60Start = new Date(NOW.getTime() - 60 * MS_IN_DAY);

function hoursFromEntry(entry) {
  const media = entry.media_items;
  if (!media || !media.category) return null;
  const category = media.category;

  const toNumber = value => (typeof value === 'number' ? value : null);

  if (category === 'games') {
    return toNumber(media.duration ?? null);
  }

  if (category === 'anime') {
    const runtime = toNumber(media.duration ?? media.runtime ?? 24);
    const episodes = media.number_of_episodes ?? media.episodes ?? null;
    if (runtime && episodes) {
      return (episodes * runtime) / 60;
    }
    return null;
  }

  if (category === 'tv') {
    const runtime = toNumber(media.runtime ?? 45);
    const episodes = media.number_of_episodes ?? media.episodes ?? null;
    if (runtime && episodes) {
      return (episodes * runtime) / 60;
    }
    return null;
  }

  if (category === 'movies') {
    const runtime = toNumber(media.runtime ?? 120);
    return runtime ? runtime / 60 : null;
  }

  if (category === 'books') {
    const pages = media.page_count;
    if (!pages) return null;
    return pages / 35;
  }

  if (category === 'manga') {
    const volumes = media.volumes ?? media.chapters ?? null;
    if (!volumes) return null;
    const pages = volumes * 220;
    return pages / 55;
  }

  return null;
}

function getBucket(hours) {
  if (hours === null) return null;
  if (hours < 15) return '<15h';
  if (hours <= 40) return '15-40h';
  return '>40h';
}

async function main() {
  const { data: users } = await supabase
    .from('users')
    .select('id, username, display_name, email')
    .order('created_at', { ascending: true })
    .limit(1);

  if (!users || users.length === 0) {
    console.log('No users found');
    return;
  }

  const user = users[0];
  console.log('Analyzing user', user.id);

  const { data: entries } = await supabase
    .from('user_media_entries')
    .select(`
      id,
      created_at,
      updated_at,
      status,
      progress,
      score,
      selected_platform,
      media_items!inner (
        id,
        title,
        category,
        genres,
        platforms,
        duration,
        runtime,
        number_of_episodes,
        episodes,
        page_count,
        volumes,
        chapters,
        start_date,
        end_date,
        release_date,
        first_air_date,
        title_english,
        title_native,
        title_romaji
      )
    `)
    .eq('user_id', user.id);

  if (!entries) {
    console.log('No entries for user');
    return;
  }

  const counts = {
    total: entries.length,
    completed: 0,
    dropped: 0,
    current: 0,
    planned: 0,
  };

  const buckets = {
    '<15h': { total: 0, completed: 0 },
    '15-40h': { total: 0, completed: 0 },
    '>40h': { total: 0, completed: 0 },
  };

  const platformDropStats = new Map();
  const genreCompletions = new Map();
  const categoryRatings = new Map();
  const completionsByCategory = new Map();

  let recentDrops = 0;
  let recentCompletes = 0;

  for (const entry of entries) {
    const category = entry.media_items?.category ?? 'unknown';
    const status = entry.status;
    if (status === 'completed') counts.completed++;
    if (status === 'dropped') counts.dropped++;
    if (status === 'current') counts.current++;
    if (status === 'planned') counts.planned++;

    const hours = hoursFromEntry(entry);
    const bucketKey = getBucket(hours);
    if (bucketKey) {
      buckets[bucketKey].total++;
      if (status === 'completed') {
        buckets[bucketKey].completed++;
      }
    }

    const rawPlatform = entry.selected_platform ?? entry.media_items?.platforms?.[0];
    const platformKey = rawPlatform ?? 'Unknown';
    const platStats = platformDropStats.get(platformKey) ?? { total: 0, dropped: 0, completed: 0 };
    platStats.total++;
    if (status === 'dropped') platStats.dropped++;
    if (status === 'completed') platStats.completed++;
    platformDropStats.set(platformKey, platStats);

    if (status === 'completed') {
      completionsByCategory.set(category, (completionsByCategory.get(category) ?? 0) + 1);
    }

    if (status === 'completed' && Array.isArray(entry.media_items?.genres)) {
      for (const genre of entry.media_items.genres) {
        if (!genre) continue;
        genreCompletions.set(genre, (genreCompletions.get(genre) ?? 0) + 1);
      }
    }

    if (status === 'completed' && typeof entry.score === 'number') {
      const stats = categoryRatings.get(category) ?? { totalScore: 0, count: 0 };
      stats.totalScore += entry.score;
      stats.count++;
      categoryRatings.set(category, stats);
    }

    const updatedAt = entry.updated_at ? new Date(entry.updated_at) : null;
    if (updatedAt && updatedAt >= last60Start) {
      if (status === 'dropped') recentDrops++;
      if (status === 'completed') recentCompletes++;
    }
  }

  const bucketCompletionRates = Object.fromEntries(
    Object.entries(buckets).map(([key, value]) => [
      key,
      value.total ? value.completed / value.total : null,
    ]),
  );

  const bucketDetails = Object.fromEntries(
    Object.entries(buckets).map(([key, value]) => [
      key,
      {
        total: value.total,
        completed: value.completed,
        rate: value.total ? value.completed / value.total : null,
      },
    ]),
  );

  const platformDropRates = Array.from(platformDropStats.entries()).map(([platform, stats]) => ({
    platform,
    dropRate: stats.total ? stats.dropped / stats.total : 0,
    total: stats.total,
  }));

  platformDropRates.sort((a, b) => b.dropRate - a.dropRate);

  const sortedGenres = Array.from(genreCompletions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const categoryAvgRatings = Array.from(categoryRatings.entries())
    .map(([category, stats]) => ({
      category,
      average: stats.count ? stats.totalScore / stats.count : 0,
    }))
    .sort((a, b) => b.average - a.average);

  const dropRateLast60 =
    recentDrops + recentCompletes ? recentDrops / (recentDrops + recentCompletes) : 0;

  const completionRateTotal =
    counts.completed + counts.dropped ? counts.completed / (counts.completed + counts.dropped) : 0;

  const completionRates = Object.values(bucketCompletionRates).map(rate => rate ?? 0);
  const rateRange =
    completionRates.length > 0 ? Math.max(...completionRates) - Math.min(...completionRates) : 0;

  const weightCompletionPattern = Math.min(
    1,
    0.3 + rateRange * 0.7 + completionRateTotal * 0.2,
  );
  const weightDropPattern = Math.min(1, dropRateLast60 * 1.1);
  const weightRecentBehavior = Math.min(1, 0.4 + (recentDrops + recentCompletes) / 100);

  const confidenceScore =
    weightCompletionPattern * 0.4 + weightDropPattern * 0.3 + weightRecentBehavior * 0.3;

  console.log('Summary', {
    counts,
    bucketCompletionRates,
    bucketDetails,
    platformDropRates: platformDropRates.slice(0, 3),
    topGenres: sortedGenres.slice(0, 3),
    topCategoryByRating: categoryAvgRatings[0] ?? null,
    categoryAvgRatings,
    completionRateTotal,
    dropRateLast60,
    recentDrops,
    recentCompletes,
    confidenceScore,
    weights: { weightCompletionPattern, weightDropPattern, weightRecentBehavior },
    completionsByCategory: Object.fromEntries(completionsByCategory),
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
