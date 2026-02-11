import { ROADMAP_ITEMS, getStatusLabel } from '@/config/roadmap';

const statusColors = {
  done: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'in-progress':
    'bg-[var(--hb-primary-strong)]/10 text-[var(--hb-primary-strong)] border-[var(--hb-primary-strong)]/30',
  planned: 'bg-[var(--hb-muted)]/10 text-[var(--hb-muted)] border-[var(--hb-border)]',
};

export function AboutRoadmap() {
  return (
    <section className="px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
            Roadmap
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[var(--hb-headline)] md:text-4xl">
            What is next
          </h2>
          <p className="mx-auto max-w-xl text-[var(--hb-muted)]">
            We keep improving Hobbista. Here are some of the features we plan next.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROADMAP_ITEMS.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="hover:border-[var(--hb-primary-strong)]/40 group rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-5 transition"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-[var(--hb-muted)] transition-colors group-hover:text-[var(--hb-primary-strong)]">
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${statusColors[item.status]}`}
                >
                  {getStatusLabel(item.status, 'full')}
                </span>
              </div>
              <h3 className="mb-2 font-semibold text-[var(--hb-headline)]">{item.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--hb-muted)]">{item.description}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-[var(--hb-muted)]">
          * The roadmap can change based on community feedback
        </p>
      </div>
    </section>
  );
}
