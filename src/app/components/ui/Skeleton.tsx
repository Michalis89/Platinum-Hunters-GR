interface SkeletonProps {
  readonly type?:
    | 'page'
    | 'grid'
    | 'card'
    | 'guide-detail'
    | 'backlog'
    | 'guides-list'
    | 'profile'
    | 'profile-edit';
  readonly count?: number;
  readonly className?: string;
}

export default function Skeleton({ type = 'page', count = 6, className = '' }: SkeletonProps) {
  if (type === 'guides-list') {
    return (
      <div
        className={`min-h-screen bg-[var(--hb-bg)] px-4 py-16 text-[var(--hb-text)] ${className}`}
        data-testid="skeleton"
      >
        <div className="relative mx-auto flex max-w-7xl animate-pulse flex-col gap-10">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] px-6 py-8 shadow-[0_12px_30px_rgba(3,7,18,0.45)] backdrop-blur-xl md:px-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl border border-[var(--hb-border)] bg-white/5" />
                  <div className="h-10 w-36 rounded bg-white/10" />
                </div>
                <div className="h-4 w-80 max-w-full rounded bg-white/10" />
                <div className="h-4 w-64 max-w-full rounded bg-white/10" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4 shadow-inner shadow-black/20"
                  >
                    <div className="h-3 w-14 rounded bg-white/10" />
                    <div className="mt-2 h-6 w-12 rounded bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="relative grid gap-4 lg:grid-cols-[320px,1fr]">
            {/* Filters sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-6 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 shadow-lg shadow-black/30 backdrop-blur-xl">
                <div className="h-5 w-32 rounded bg-[var(--hb-card)]" />
                <div className="mt-4 space-y-3">
                  <div className="h-10 w-full rounded-lg bg-[var(--hb-card)]" />
                  <div className="h-10 w-full rounded-lg bg-[var(--hb-card)]" />
                  <div className="h-10 w-full rounded-lg bg-[var(--hb-card)]" />
                  <div className="h-10 w-full rounded-lg bg-[var(--hb-card)]" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Mobile filters + controls */}
              <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 shadow-lg shadow-black/30 backdrop-blur-xl">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="h-11 w-full rounded-lg bg-white/5 md:max-w-sm" />
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-11 w-36 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)]"
                      />
                    ))}
                    <div className="h-11 w-28 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] lg:hidden" />
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 shadow-lg shadow-black/30 backdrop-blur-sm"
                    data-testid="skeleton-item"
                  >
                    <div className="h-4 w-5/6 rounded bg-white/10" />
                    <div className="mt-3 h-4 w-2/3 rounded bg-white/10" />
                    <div className="mt-3 h-4 w-1/2 rounded bg-white/10" />
                    <div className="mt-4 flex gap-2">
                      <div className="h-6 w-16 rounded-full bg-white/10" />
                      <div className="h-6 w-16 rounded-full bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'backlog') {
    return (
      <div
        className={`min-h-screen bg-[var(--hb-bg)] px-4 py-24 text-[var(--hb-text)] ${className}`}
        data-testid="skeleton"
      >
        <div className="mx-auto max-w-7xl animate-pulse space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl border border-[var(--hb-border)] bg-white/5" />
              <div className="space-y-2">
                <div className="h-6 w-40 rounded bg-white/10" />
                <div className="h-4 w-56 rounded bg-white/10" />
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)]"
                data-testid="skeleton-item"
              />
            ))}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-10 w-28 rounded-lg border border-[var(--hb-border)] bg-[var(--hb-panel)]"
              />
            ))}
          </div>

          {/* Search / sort / add */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-3">
              <div className="h-11 flex-1 rounded-lg bg-white/5" />
              <div className="h-11 w-44 rounded-lg bg-white/5" />
              <div className="h-11 w-11 rounded-lg bg-white/5" />
            </div>
            <div className="bg-[var(--hb-primary-strong)]/25 h-11 w-52 rounded-lg" />
          </div>

          {/* Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4"
                data-testid="skeleton-item"
              >
                <div className="h-5 w-3/4 rounded bg-white/10" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-full rounded bg-white/10" />
                  <div className="h-4 w-5/6 rounded bg-white/10" />
                  <div className="h-4 w-2/3 rounded bg-white/10" />
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="h-6 w-16 rounded-full bg-white/10" />
                  <div className="h-6 w-20 rounded-full bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div
        className={`min-h-screen bg-[var(--hb-bg)] py-10 text-[var(--hb-text)] ${className}`}
        data-testid="skeleton"
      >
        <div className="mx-auto flex w-full max-w-6xl animate-pulse flex-col gap-8 px-4">
          {/* Header card with categories */}
          <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-[0_12px_30px_rgba(3,7,18,0.45)] backdrop-blur">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full border border-[var(--hb-border)] bg-white/5 md:h-24 md:w-24" />
                <div className="space-y-2">
                  <div className="h-3 w-32 rounded bg-white/10" />
                  <div className="h-7 w-48 rounded bg-white/10" />
                  <div className="h-4 w-28 rounded bg-white/10" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 rounded-full bg-white/10" />
                    <div className="h-6 w-24 rounded-full bg-white/10" />
                  </div>
                </div>
              </div>
              <div className="bg-[var(--hb-primary-strong)]/30 h-10 w-10 rounded-full" />
            </div>
            <div className="mt-4 space-y-2 border-t border-[var(--hb-border)] pt-4">
              <div className="h-3 w-40 rounded bg-white/10" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-7 w-28 rounded-full border border-[var(--hb-border)] bg-white/5"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Personal info full row */}
          <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 backdrop-blur">
            <div className="mb-4 h-5 w-44 rounded bg-white/10" />
            <div className="grid gap-4 text-sm lg:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-white/10" />
                  <div className="h-4 w-40 rounded bg-white/10" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-white/10" />
                  <div className="h-4 w-28 rounded bg-white/10" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-white/10" />
                  <div className="h-4 w-32 rounded bg-white/10" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-white/10" />
                  <div className="h-4 w-28 rounded bg-white/10" />
                </div>
                <div className="h-16 rounded bg-white/5" />
              </div>
            </div>
          </div>

          {/* Favorites + category panel */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 backdrop-blur lg:col-span-2">
              <div className="mb-4 space-y-3">
                <div className="h-5 w-32 rounded bg-white/10" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-7 w-28 rounded-full border border-[var(--hb-border)] bg-white/5"
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3"
                  >
                    <div className="h-10 w-10 rounded bg-white/5" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 rounded bg-white/10" />
                      <div className="h-3 w-28 rounded bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 backdrop-blur">
              <div className="mb-3 h-5 w-28 rounded bg-white/10" />
              <div className="space-y-2">
                <div className="h-4 w-44 rounded bg-white/10" />
                <div className="h-4 w-36 rounded bg-white/10" />
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-9 w-full rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)]" />
                <div className="h-9 w-full rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)]" />
              </div>
              <div className="mt-4 space-y-3 border-t border-[var(--hb-border)] pt-4">
                <div className="h-3 w-32 rounded bg-white/10" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-4 w-36 rounded bg-white/10" />
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-14 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)]"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Account info */}
          <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 backdrop-blur">
            <div className="mb-4 h-5 w-44 rounded bg-white/10" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-white/10" />
                <div className="h-4 w-24 rounded bg-white/10" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-40 rounded bg-white/10" />
                <div className="h-4 w-28 rounded bg-white/10" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-48 rounded bg-white/10" />
                <div className="h-4 w-20 rounded bg-white/10" />
              </div>
            </div>
          </div>

          {/* Activity feed */}
          <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 shadow-[0_12px_30px_rgba(3,7,18,0.45)]">
            <div className="mb-3 flex items-center justify-between">
              <div className="h-5 w-32 rounded bg-white/10" />
              <div className="h-3 w-12 rounded bg-white/10" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3"
                >
                  <div className="h-8 w-8 rounded-full bg-white/5" />
                  <div className="space-y-2">
                    <div className="h-4 w-40 rounded bg-white/10" />
                    <div className="h-3 w-24 rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'profile-edit') {
    return (
      <div className={`min-h-screen bg-[var(--hb-bg)] py-10 ${className}`} data-testid="skeleton">
        <div className="mx-auto flex w-full max-w-4xl animate-pulse flex-col gap-6 px-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="h-3 w-44 rounded bg-white/10" />
            <div className="h-7 w-64 rounded bg-white/10" />
          </div>

          {/* Personal info */}
          <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 backdrop-blur">
            <div className="mb-4 h-5 w-40 rounded bg-white/10" />
            <div className="space-y-3">
              <div className="h-11 w-full rounded-lg bg-white/5" />
              <div className="h-11 w-full rounded-lg bg-white/5" />
              <div className="h-11 w-full rounded-lg bg-white/5" />
              <div className="h-20 w-full rounded-lg bg-white/5" />
            </div>
          </div>

          {/* Categories chips */}
          <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 backdrop-blur">
            <div className="mb-3 h-5 w-40 rounded bg-white/10" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-8 w-24 rounded-full bg-white/5" />
              ))}
            </div>
          </div>

          {/* Three section cards placeholder */}
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 backdrop-blur"
              >
                <div className="mb-3 h-5 w-36 rounded bg-white/10" />
                <div className="space-y-2">
                  <div className="h-4 w-3/4 rounded bg-white/10" />
                  <div className="h-4 w-2/3 rounded bg-white/10" />
                  <div className="h-4 w-1/2 rounded bg-white/10" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: 8 }).map((__, chip) => (
                    <div key={chip} className="h-7 w-20 rounded-full bg-white/5" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Save buttons */}
          <div className="flex justify-end gap-3">
            <div className="h-11 w-32 rounded-xl bg-white/15" />
            <div className="h-11 w-32 rounded-xl bg-white/5" />
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl border-2 border-red-900/60 bg-red-950/25 p-6 backdrop-blur">
            <div className="mb-3 h-5 w-32 rounded bg-red-900/60" />
            <div className="space-y-2">
              <div className="h-4 w-3/4 rounded bg-red-900/40" />
              <div className="h-4 w-2/3 rounded bg-red-900/40" />
            </div>
            <div className="mt-4 h-10 w-48 rounded-xl bg-red-800/40" />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'guide-detail') {
    return (
      <div
        className={`min-h-screen bg-[var(--hb-bg)] px-4 py-16 text-[var(--hb-text)] ${className}`}
        data-testid="skeleton"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          {/* Hero */}
          <div className="flex animate-pulse flex-col gap-6 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-2xl shadow-black/30 backdrop-blur-sm sm:flex-row sm:items-center">
            <div className="flex justify-center sm:block sm:w-48">
              <div className="h-48 w-40 rounded-xl bg-[var(--hb-card)] sm:h-56 sm:w-44" />
            </div>
            <div className="flex flex-1 flex-col gap-4">
              <div className="h-6 w-40 rounded bg-[var(--hb-card)]" />
              <div className="h-8 w-3/4 rounded bg-[var(--hb-card)]" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="h-10 rounded-xl bg-[var(--hb-card)]" />
                <div className="h-10 rounded-xl bg-[var(--hb-card)]" />
                <div className="h-10 rounded-xl bg-[var(--hb-card)]" />
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="h-6 w-28 rounded-full bg-[var(--hb-card)]" />
                <div className="h-6 w-32 rounded-full bg-[var(--hb-card)]" />
                <div className="h-6 w-24 rounded-full bg-[var(--hb-card)]" />
              </div>
            </div>
          </div>

          {/* Info + trophies */}
          <div className="grid animate-pulse gap-6 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-xl shadow-black/30 backdrop-blur-sm md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-[var(--hb-card)]" />
                <div className="h-5 w-36 rounded bg-[var(--hb-card)]" />
              </div>
              <div className="space-y-3 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
                <div className="h-4 w-3/4 rounded bg-[var(--hb-panel)]" />
                <div className="h-4 w-2/3 rounded bg-[var(--hb-panel)]" />
                <div className="h-4 w-5/6 rounded bg-[var(--hb-panel)]" />
                <div className="h-4 w-1/2 rounded bg-[var(--hb-panel)]" />
                <div className="h-4 w-4/6 rounded bg-[var(--hb-panel)]" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <div className="h-6 w-20 rounded-full bg-[var(--hb-panel)]" />
                  <div className="h-6 w-24 rounded-full bg-[var(--hb-panel)]" />
                  <div className="h-6 w-16 rounded-full bg-[var(--hb-panel)]" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
              <div className="h-5 w-32 rounded bg-[var(--hb-panel)]" />
              <div className="space-y-3 pt-1">
                <div className="h-4 w-full rounded bg-[var(--hb-panel)]" />
                <div className="h-4 w-5/6 rounded bg-[var(--hb-panel)]" />
                <div className="h-4 w-4/6 rounded bg-[var(--hb-panel)]" />
                <div className="h-4 w-3/4 rounded bg-[var(--hb-panel)]" />
              </div>
            </div>
          </div>

          {/* Guides */}
          <div className="animate-pulse space-y-4 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-xl shadow-black/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-5 w-24 rounded bg-[var(--hb-card)]" />
                <div className="h-3 w-40 rounded bg-[var(--hb-card)]" />
              </div>
              <div className="h-4 w-28 rounded bg-[var(--hb-card)]" />
            </div>

            <div className="space-y-3 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4 shadow-inner shadow-black/20">
              <div className="h-4 w-20 rounded bg-[var(--hb-panel)]" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-[var(--hb-panel)]" />
                <div className="h-3 w-5/6 rounded bg-[var(--hb-panel)]" />
                <div className="h-3 w-2/3 rounded bg-[var(--hb-panel)]" />
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4 shadow-inner shadow-black/20">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 shadow"
                  data-testid="skeleton-item"
                >
                  <div className="h-4 w-2/3 rounded bg-[var(--hb-card)]" />
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-[var(--hb-card)]" />
                    <div className="h-3 w-5/6 rounded bg-[var(--hb-card)]" />
                    <div className="h-3 w-3/4 rounded bg-[var(--hb-card)]" />
                    <div className="h-3 w-2/3 rounded bg-[var(--hb-card)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'page') {
    return (
      <div
        className={`flex min-h-screen flex-col items-center bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white ${className}`}
        data-testid="skeleton"
      >
        <div className="w-full max-w-3xl animate-pulse rounded-lg bg-gray-900 p-6 shadow-lg">
          <div className="mb-4 flex justify-center">
            <div className="h-48 w-48 rounded-lg bg-gray-700"></div>
          </div>
          <div className="mx-auto h-6 w-3/4 rounded bg-gray-700"></div>
          <div className="mx-auto mt-2 h-4 w-1/2 rounded bg-gray-700"></div>
        </div>
      </div>
    );
  }

  if (type === 'grid') {
    return (
      <div
        className={`grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 ${className}`}
        data-testid="skeleton"
      >
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="flex animate-pulse flex-col items-center rounded-lg bg-gray-700 p-4 shadow-lg"
            data-testid="skeleton-item"
          >
            <div className="h-40 w-32 rounded-lg bg-gray-600"></div>
            <div className="mt-4 h-4 w-3/4 rounded bg-gray-500"></div>
            <div className="mt-2 h-4 w-1/2 rounded bg-gray-500"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div
        className={`flex animate-pulse flex-col items-center rounded-lg bg-gray-700 p-4 shadow-lg ${className}`}
        data-testid="skeleton"
      >
        <div className="h-40 w-32 rounded-lg bg-gray-600"></div>
        <div className="mt-4 h-4 w-3/4 rounded bg-gray-500"></div>
        <div className="mt-2 h-4 w-1/2 rounded bg-gray-500"></div>
      </div>
    );
  }

  return null;
}
