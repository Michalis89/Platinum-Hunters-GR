'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { PageContainer } from '@/app/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/alert';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { selectIsAdminOrModerator } from '@/store/slices/authSlice';
import AdminSupportNav from './AdminSupportNav';

type AdminSupportShellProps = {
  children: ReactNode;
};

export default function AdminSupportShell({ children }: AdminSupportShellProps) {
  const pathname = usePathname();
  const isAdmin = useSelector(selectIsAdminOrModerator);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (!isAdmin) {
    return (
      <PageContainer size="lg" className="py-20">
        <ErrorAlert message="You do not have access to this page." />
      </PageContainer>
    );
  }

  return (
    <div className="admin-support-root min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <PageContainer size="full" className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open support navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Button href="/home" variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to application
            </Button>
          </div>
          <h1 className="text-sm font-semibold tracking-wide text-foreground sm:text-base">
            Admin Support
          </h1>
          <div className="w-8 sm:w-[156px]" />
        </PageContainer>
      </header>

      <PageContainer size="full" className="flex items-start gap-6 py-6">
        <aside className="sticky top-20 hidden w-64 shrink-0 rounded-xl border border-border bg-card p-3 md:block">
          <AdminSupportNav pathname={pathname} />
        </aside>
        <section className="min-w-0 flex-1">{children}</section>
      </PageContainer>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[280px] p-4">
          <div className="mb-4">
            <div className="text-sm font-semibold text-foreground">Support Navigation</div>
          </div>
          <AdminSupportNav pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
          <div className="mt-4 border-t border-border pt-4">
            <Link
              href="/home"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
              onClick={() => setMobileNavOpen(false)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to application
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
