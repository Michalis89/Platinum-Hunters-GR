import NavbarWrapper from '@/app/components/NavbarWrapper';
import { Footer } from '@/app/components/layout/Footer';
import { PageContainer } from '@/app/components/layout';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[var(--hb-bg)] text-[var(--hb-text)]">
      <div className="relative flex min-h-screen flex-col">
        <NavbarWrapper />
        <main className="flex-1 pb-12 pt-4">
          <PageContainer size="sm" noPadding>
            {children}
          </PageContainer>
        </main>
        <Footer />
      </div>
    </div>
  );
}
