import HomeDashboardPageClient from '@/app/components/home/HomeDashboardPageClient';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Dashboard | Hobbistas',
  description: 'Προσωπικό dashboard για το backlog, την πρόοδο και τις προτάσεις σου.',
  path: '/dashboard',
  noindex: true,
});

export default function DashboardPage() {
  return (
    <section className="apple-dashboard apple-page-background relative isolate min-h-screen text-[var(--apple-label)]">
      <h1 className="sr-only">Dashboard</h1>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--apple-system-blue)_14%,transparent)] blur-3xl" />
      </div>
      <div className="relative px-2 pb-10 pt-2 md:px-4 md:pb-14 md:pt-4">
        <div className="mx-auto max-w-[1280px]">
          <div className="apple-material-surface overflow-hidden">
            <HomeDashboardPageClient />
          </div>
        </div>
      </div>
    </section>
  );
}

