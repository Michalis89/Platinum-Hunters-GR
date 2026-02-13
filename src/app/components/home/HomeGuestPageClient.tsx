import { PageContainer } from '@/app/components/layout';
import {
  HomeHero,
  HomeFeatures,
  HomeHowItWorks,
  HomeRoadmapPreview,
  HomeFinalCTA,
} from '@/app/components/home';

export default function HomeGuestPageClient() {
  return (
    <main className="pb-12 md:pb-20">
      <HomeHero />

      <PageContainer size="xl">
        <HomeFeatures />
      </PageContainer>

      <PageContainer size="xl">
        <div className="mx-auto w-full max-w-5xl" />
      </PageContainer>

      <HomeHowItWorks />

      <PageContainer size="xl">
        <div className="mx-auto w-full max-w-5xl" />
      </PageContainer>

      <PageContainer size="xl">
        <HomeRoadmapPreview />
      </PageContainer>

      <HomeFinalCTA />
    </main>
  );
}
