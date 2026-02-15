import getSupabaseServer from '@/lib/supabase-server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import {
  AboutHero,
  AboutFeatures,
  AboutHowItWorks,
  AboutPhilosophy,
  AboutRoadmap,
  AboutPeople,
  AboutFAQ,
  AboutFinalCTA,
  type TeamMember,
} from '@/app/components/about';
import AboutStatsLoader from '@/app/(main)/about/AboutStatsLoader.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import StructuredData from '@/utils/seo/StructuredData';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';
import { SITE_URL } from '@/config/site';
import type { ReactNode } from 'react';

type AboutSectionShellProps = {
  children: ReactNode;
  maxWidthClass?: string;
};

function AboutSectionShell({
  children,
  maxWidthClass = 'max-w-screen-2xl',
}: AboutSectionShellProps) {
  return (
    <div className={`mx-auto w-full px-3 md:px-6 ${maxWidthClass}`}>
      <div className="">{children}</div>
    </div>
  );
}

export const metadata = buildMetadata({
  title: 'About Hobbista',
  description: 'Learn who we are, how we work, and why Hobbistas was created for every hobby.',
  path: '/about',
});

async function getTeam(): Promise<TeamMember[]> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('users')
      .select('id,username,display_name,role,roles,bio,avatar_url,country,favorite_platform')
      .or(
        'role.in.(owner,admin,moderator,author,reviewer),roles.ov.{owner,admin,moderator,author,reviewer}',
      )
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

  // Check auth status server-side
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuthenticated = !!session;

  const breadcrumb = [
    { name: 'Home', url: `${SITE_URL}/` },
    { name: 'About', url: `${SITE_URL}/about` },
  ];

  return (
    <>
      <StructuredData data={getBreadcrumbStructuredData(breadcrumb)} />
      <main className="relative min-h-screen text-foreground">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background:
                'radial-gradient(circle at 4% -12%, hsl(var(--accent-primary) / 0.12), transparent 48%), radial-gradient(circle at 88% -10%, hsl(var(--accent-primary) / 0.08), transparent 44%), radial-gradient(circle at 50% 100%, hsl(var(--accent-primary) / 0.06), transparent 50%)',
            }}
          />
        </div>

        <div className="relative pb-14 md:pb-20">
          <AboutHero isAuthenticated={isAuthenticated} />

          <AboutSectionShell>
            <AboutFeatures />
          </AboutSectionShell>

          <div className="my-4 md:my-6">
            <AboutSectionShell maxWidthClass="max-w-6xl">
              <AboutHowItWorks />
            </AboutSectionShell>
          </div>

          <AboutSectionShell maxWidthClass="max-w-6xl">
            <AboutPhilosophy />
          </AboutSectionShell>

          <div className="my-4 md:my-6">
            <AboutSectionShell>
              <AboutStatsLoader />
            </AboutSectionShell>
          </div>

          <AboutSectionShell maxWidthClass="max-w-6xl">
            <AboutRoadmap />
          </AboutSectionShell>

          <div className="my-4 md:my-6">
            <AboutSectionShell maxWidthClass="max-w-6xl">
              <AboutPeople team={team} />
            </AboutSectionShell>
          </div>

          <AboutSectionShell maxWidthClass="max-w-4xl">
            <AboutFAQ />
          </AboutSectionShell>

          <div className="mt-4 md:mt-6">
            <AboutSectionShell maxWidthClass="max-w-5xl">
              <AboutFinalCTA isAuthenticated={isAuthenticated} />
            </AboutSectionShell>
          </div>
        </div>
      </main>
    </>
  );
}
