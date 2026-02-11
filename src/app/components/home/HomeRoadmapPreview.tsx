import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getStatusLabel, getTeaserRoadmapItems } from '@/config/roadmap';

const statusColors = {
  done: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-300',
  'in-progress':
    'border-[color-mix(in_srgb,var(--apple-system-blue)_45%,transparent)] bg-[color-mix(in_srgb,var(--apple-system-blue)_14%,transparent)] text-[var(--apple-system-blue)]',
  planned:
    'border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)] text-[var(--apple-secondary-label)]',
};

const previewItems = getTeaserRoadmapItems();

export function HomeRoadmapPreview() {
  return (
    <section className="px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center md:mb-12">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--apple-system-blue)]">Coming soon</p>
          <h2 className="apple-title-tracking mb-4 text-3xl font-semibold text-[var(--apple-label)] md:text-4xl">
            What&apos;s next
          </h2>
          <p className="apple-body-tracking mx-auto max-w-xl text-[var(--apple-secondary-label)]">
            We&apos;re actively building new features. Here&apos;s a preview.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {previewItems.map(item => (
            <div
              key={item.title}
              className="apple-card group rounded-[var(--apple-radius-card)] p-5 transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--apple-system-blue)_34%,transparent)]"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)] text-[var(--apple-secondary-label)] transition-colors group-hover:text-[var(--apple-system-blue)]">
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${statusColors[item.status]}`}
                >
                  {getStatusLabel(item.status, 'teaser')}
                </span>
              </div>
              <h3 className="mb-2 font-semibold tracking-[-0.01em] text-[var(--apple-label)]">{item.title}</h3>
              <p className="apple-body-tracking text-sm leading-relaxed text-[var(--apple-secondary-label)]">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/about"
            className="apple-focus-ring group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[var(--apple-system-blue)] transition hover:bg-[var(--apple-tertiary-fill)]"
          >
            See the full roadmap
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
