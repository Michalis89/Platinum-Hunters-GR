import getSupabaseServer from '@/lib/supabase-server';
import {
  AboutHero,
  AboutFeatures,
  AboutHowItWorks,
  AboutPhilosophy,
  AboutStats,
  AboutRoadmap,
  AboutPeople,
  AboutFAQ,
  AboutFinalCTA,
  type TeamMember,
  type AboutStatsProps,
} from '@/app/components/about';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import StructuredData from '@/utils/seo/StructuredData';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';
import { SITE_URL } from '@/config/site';

export const metadata = buildMetadata({
  title: 'Σχετικά με τον Χομπίστα | Χομπίστας',
  description: 'Μάθε ποιοι είμαστε, πώς δουλεύουμε και γιατί ο Χομπίστας φτιάχτηκε για κάθε χόμπι.',
  path: '/pages/about',
});

async function getTeam(): Promise<TeamMember[]> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('users')
      .select('id,username,display_name,role,bio,avatar_url,country,favorite_platform')
      .in('role', ['admin', 'author'])
      .order('role', { ascending: true });

    if (error || !data) {
      console.error('Failed to load team', error);
      return [];
    }
    return data as TeamMember[];
  } catch (err) {
    console.error('Supabase server error', err);
    return [];
  }
}

async function getStats(): Promise<AboutStatsProps> {
  try {
    const supabase = getSupabaseServer();
    const [
      { count: totalUsers },
      { count: totalGuides },
      { count: totalGames },
      { count: totalAnime },
      { count: totalManga },
      { count: totalMovies },
      { count: totalTv },
      { count: totalBooks },
      { count: totalArticles },
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('guides').select('id', { count: 'exact', head: true }),
      supabase.from('games').select('id', { count: 'exact', head: true }),
      supabase.from('media_items').select('id', { count: 'exact', head: true }).eq('category', 'anime'),
      supabase.from('media_items').select('id', { count: 'exact', head: true }).eq('category', 'manga'),
      supabase.from('media_items').select('id', { count: 'exact', head: true }).eq('category', 'movies'),
      supabase.from('media_items').select('id', { count: 'exact', head: true }).eq('category', 'tv'),
      supabase.from('media_items').select('id', { count: 'exact', head: true }).eq('category', 'books'),
      supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    ]);

    return {
      totalUsers: totalUsers ?? 0,
      totalGuides: totalGuides ?? 0,
      totalGames: totalGames ?? 0,
      totalAnime: totalAnime ?? 0,
      totalManga: totalManga ?? 0,
      totalMovies: totalMovies ?? 0,
      totalTv: totalTv ?? 0,
      totalBooks: totalBooks ?? 0,
      totalArticles: totalArticles ?? 0,
    };
  } catch (err) {
    console.error('Failed to load stats', err);
    return {
      totalUsers: 0,
      totalGuides: 0,
      totalGames: 0,
      totalAnime: 0,
      totalManga: 0,
      totalMovies: 0,
      totalTv: 0,
      totalBooks: 0,
      totalArticles: 0,
    };
  }
}

export default async function AboutPage() {
  const [team, stats] = await Promise.all([getTeam(), getStats()]);
  const breadcrumb = [
    { name: 'Αρχική', url: `${SITE_URL}/` },
    { name: 'Σχετικά', url: `${SITE_URL}/pages/about` },
  ];

  return (
    <>
      <StructuredData data={getBreadcrumbStructuredData(breadcrumb)} />
      <div className="relative min-h-screen bg-[var(--hb-bg)] text-[var(--hb-text)]">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
          <div className="absolute inset-0 bg-[var(--hb-gradient)] blur-[100px]" />
        </div>

        {/* Content */}
        <div className="relative">
          <AboutHero />

          <div className="mx-auto max-w-7xl">
            <AboutFeatures />
          </div>

          <AboutHowItWorks />

          <div className="mx-auto max-w-7xl">
            <AboutPhilosophy />
          </div>

          <AboutStats {...stats} />

          <div className="mx-auto max-w-7xl">
            <AboutRoadmap />
          </div>

          <AboutPeople team={team} />

          <AboutFAQ />

          <AboutFinalCTA />
        </div>
      </div>
    </>
  );
}
