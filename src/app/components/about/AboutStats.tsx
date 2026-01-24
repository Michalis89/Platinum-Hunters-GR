type Stat = {
  value: string;
  label: string;
  note?: string;
};

const stats: Stat[] = [
  {
    value: '500+',
    label: 'Trophy Guides',
    note: 'και συνεχίζουμε',
  },
  {
    value: '1.2K+',
    label: 'Χρήστες',
    note: 'beta testers',
  },
  {
    value: '6',
    label: 'Κατηγορίες',
    note: 'hobbies',
  },
  {
    value: '99.9%',
    label: 'Uptime',
    note: 'αξιοπιστία',
  },
];

export function AboutStats() {
  return (
    <section className="relative px-4 py-20 md:px-6 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--hb-bg)] via-[var(--hb-primary-strong)]/[0.03] to-[var(--hb-bg)]" />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
            Σε αριθμούς
          </p>
          <h2 className="text-3xl font-bold text-[var(--hb-headline)] md:text-4xl">
            Η κοινότητα μεγαλώνει
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 text-center shadow-[0_12px_30px_rgba(3,7,18,0.35)]"
            >
              <p className="mb-1 bg-gradient-to-r from-[var(--hb-primary-strong)] to-[var(--hb-accent)] bg-clip-text text-3xl font-extrabold text-transparent md:text-4xl">
                {stat.value}
              </p>
              <p className="font-medium text-[var(--hb-headline)]">
                {stat.label}
              </p>
              {stat.note && (
                <p className="mt-1 text-xs text-[var(--hb-muted)]">
                  {stat.note}
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-[var(--hb-muted)]">
          * Placeholder δεδομένα — θα ενημερωθούν με πραγματικά στατιστικά
        </p>
      </div>
    </section>
  );
}
