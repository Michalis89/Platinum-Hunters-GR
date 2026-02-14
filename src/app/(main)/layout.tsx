import AppShell from '@/app/components/AppShell';
import MainRouteContainer from '@/app/components/layout/MainRouteContainer.client';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <MainRouteContainer>{children}</MainRouteContainer>
    </AppShell>
  );
}
