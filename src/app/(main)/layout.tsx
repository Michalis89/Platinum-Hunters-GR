import AppShell from '@/app/components/AppShell';
import { PageContainer } from '@/app/components/layout';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <PageContainer size="lg" noPadding>
        {children}
      </PageContainer>
    </AppShell>
  );
}
