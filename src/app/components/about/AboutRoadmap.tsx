import { ROADMAP_ITEMS, getStatusLabel } from '@/config/roadmap';

const statusColors = {
  done: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'in-progress': 'bg-primary/10 text-primary border-primary/30',
  planned: 'bg-muted/10 text-muted-foreground border-border',
};

export function AboutRoadmap() {
  return (
    <section className="px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-primary">Roadmap</p>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">What is next</h2>
          <p className="mx-auto max-w-xl text-muted-foreground">
            We&apos;re building in public. Here&apos;s what&apos;s done, in progress, and planned.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROADMAP_ITEMS.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-muted-foreground transition-colors group-hover:text-primary">
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${statusColors[item.status]}`}
                >
                  {getStatusLabel(item.status, 'full')}
                </span>
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          * The roadmap can change based on community feedback
        </p>
      </div>
    </section>
  );
}
