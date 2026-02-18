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

      <PageContainer size="lg">
        <HomeFeatures />
      </PageContainer>

      <PageContainer size="lg">
        <div className="mx-auto w-full max-w-5xl" />
      </PageContainer>

      <HomeHowItWorks />

      <PageContainer size="lg">
        <div className="mx-auto w-full max-w-5xl" />
      </PageContainer>

      <PageContainer size="lg">
        <HomeRoadmapPreview />
      </PageContainer>

      <HomeFinalCTA />
    </main>
  );
}
