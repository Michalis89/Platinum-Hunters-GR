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
} from '@/app/components/about';
import { Footer } from '@/app/components/layout/Footer';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import StructuredData from '@/utils/seo/StructuredData';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';
import { SITE_URL } from '@/config/site';

export const metadata = buildMetadata({
  title: 'Σχετικά με τον Χομπίστα | Χομπίστας',
  description:
    'Μάθε ποιοι είμαστε, πώς δουλεύουμε και γιατί ο Χομπίστας φτιάχτηκε για κάθε χόμπι.',
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

export default async function AboutPage() {
  const team = await getTeam();
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

          <AboutStats />

          <div className="mx-auto max-w-7xl">
            <AboutRoadmap />
          </div>

          <AboutPeople team={team} />

          <AboutFAQ />

          <AboutFinalCTA />

          <Footer />
        </div>
      </div>
    </>
  );
}
