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
    <>
      <HomeHero />

      <PageContainer size="xl">
        <HomeFeatures />
      </PageContainer>

      <HomeHowItWorks />

      <PageContainer size="xl">
        <HomeRoadmapPreview />
      </PageContainer>

      <HomeFinalCTA />
    </>
  );
}

