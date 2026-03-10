import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getStatusLabel, getTeaserRoadmapItems } from '@/config/roadmap';

const statusColors = {
  done: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-300',
  'in-progress': 'border-primary/45 bg-primary/20 text-foreground',
  planned: ' bg-card text-muted-foreground',
};

const previewItems = getTeaserRoadmapItems();

export function HomeRoadmapPreview() {
  return (
    <section className="px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center md:mb-12">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-foreground/80">Coming soon</p>
          <h2 className="mb-4 text-3xl font-semibold text-foreground md:text-4xl">
            What&apos;s next
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground">
            We&apos;re actively building new features. Here&apos;s a preview.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {previewItems.map(item => (
            <div
              key={item.title}
              className="duration-400 group rounded-lg p-6 transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card text-muted-foreground transition-colors group-hover:bg-primary/10">
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${statusColors[item.status]}`}
                >
                  {getStatusLabel(item.status, 'teaser')}
                </span>
              </div>
              <h3 className="mb-2 font-semibold tracking-[-0.01em] text-foreground">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/about"
            className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-foreground/90 transition hover:bg-card hover:text-foreground"
          >
            See the full roadmap
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
