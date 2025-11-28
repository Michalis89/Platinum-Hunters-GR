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
        className={`min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-16 text-slate-100 ${className}`}
        data-testid="skeleton"
      >
        <div className="relative mx-auto flex max-w-7xl flex-col gap-10 animate-pulse">
          {/* Ambient glows */}
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl" />
            <div className="absolute right-0 top-32 h-52 w-52 rounded-full bg-emerald-400/15 blur-3xl" />
            <div className="absolute bottom-10 left-1/2 h-24 w-48 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
          </div>

          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/60 px-6 py-8 shadow-2xl shadow-blue-900/40 backdrop-blur-xl md:px-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-slate-800" />
                  <div className="h-10 w-36 rounded bg-slate-800/80" />
                </div>
                <div className="h-4 w-80 max-w-full rounded bg-slate-800/70" />
                <div className="h-4 w-64 max-w-full rounded bg-slate-800/60" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 shadow-inner shadow-slate-950/30"
                  >
                    <div className="h-3 w-14 rounded bg-slate-800/60" />
                    <div className="mt-2 h-6 w-12 rounded bg-slate-800/80" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="relative grid gap-4 lg:grid-cols-[320px,1fr]">
            {/* Filters sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-6 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 shadow-lg shadow-slate-900/40 backdrop-blur-xl">
                <div className="h-5 w-32 rounded bg-slate-800/70" />
                <div className="mt-4 space-y-3">
                  <div className="h-10 w-full rounded-lg bg-slate-800/60" />
                  <div className="h-10 w-full rounded-lg bg-slate-800/60" />
                  <div className="h-10 w-full rounded-lg bg-slate-800/60" />
                  <div className="h-10 w-full rounded-lg bg-slate-800/60" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Mobile filters + controls */}
              <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 shadow-lg shadow-slate-900/40 backdrop-blur-xl">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="h-11 w-full rounded-lg bg-slate-800/60 md:max-w-sm" />
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-11 w-36 rounded-xl border border-slate-800/70 bg-slate-950/70"
                      />
                    ))}
                    <div className="h-11 w-28 rounded-xl border border-slate-800/70 bg-slate-950/70 lg:hidden" />
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 shadow-lg shadow-slate-900/40 backdrop-blur-sm"
                    data-testid="skeleton-item"
                  >
                    <div className="h-4 w-5/6 rounded bg-slate-800/80" />
                    <div className="mt-3 h-4 w-2/3 rounded bg-slate-800/70" />
                    <div className="mt-3 h-4 w-1/2 rounded bg-slate-800/60" />
                    <div className="mt-4 flex gap-2">
                      <div className="h-6 w-16 rounded-full bg-slate-800/60" />
                      <div className="h-6 w-16 rounded-full bg-slate-800/50" />
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
        className={`min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-24 text-slate-100 ${className}`}
        data-testid="skeleton"
      >
        <div className="mx-auto max-w-7xl space-y-8 animate-pulse">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-800/80" />
              <div className="space-y-2">
                <div className="h-6 w-40 rounded bg-slate-800/80" />
                <div className="h-4 w-56 rounded bg-slate-800/60" />
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 rounded-xl border border-slate-800/70 bg-slate-900/60"
                data-testid="skeleton-item"
              />
            ))}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-10 w-28 rounded-lg border border-slate-800 bg-slate-900/60" />
            ))}
          </div>

          {/* Search / sort / add */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-3">
              <div className="h-11 flex-1 rounded-lg bg-slate-900/60" />
              <div className="h-11 w-44 rounded-lg bg-slate-900/60" />
              <div className="h-11 w-11 rounded-lg bg-slate-900/60" />
            </div>
            <div className="h-11 w-52 rounded-lg bg-blue-900/40" />
          </div>

          {/* Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-4"
                data-testid="skeleton-item"
              >
                <div className="h-5 w-3/4 rounded bg-slate-800/80" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-full rounded bg-slate-800/70" />
                  <div className="h-4 w-5/6 rounded bg-slate-800/60" />
                  <div className="h-4 w-2/3 rounded bg-slate-800/50" />
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="h-6 w-16 rounded-full bg-slate-800/60" />
                  <div className="h-6 w-20 rounded-full bg-slate-800/50" />
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
        className={`min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-10 ${className}`}
        data-testid="skeleton"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 animate-pulse">
          {/* Header card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl backdrop-blur">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-slate-800 md:h-24 md:w-24" />
                <div className="space-y-2">
                  <div className="h-3 w-40 rounded bg-slate-800/80" />
                  <div className="h-6 w-56 rounded bg-slate-800/70" />
                  <div className="h-4 w-32 rounded bg-slate-800/60" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 rounded-full bg-slate-800/70" />
                    <div className="h-6 w-28 rounded-full bg-slate-800/60" />
                  </div>
                </div>
              </div>
              <div className="h-11 w-44 rounded-xl bg-slate-200/50" />
            </div>
          </div>

          {/* Stats grid */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-20 rounded-xl border border-slate-800/70 bg-slate-950/50"
                  data-testid="skeleton-item"
                />
              ))}
            </div>
          </div>

          {/* Two columns */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur">
              <div className="mb-4 h-5 w-32 rounded bg-slate-800/80" />
              <div className="space-y-3">
                <div className="h-4 w-64 rounded bg-slate-800/70" />
                <div className="h-4 w-56 rounded bg-slate-800/70" />
                <div className="h-4 w-48 rounded bg-slate-800/70" />
                <div className="h-4 w-40 rounded bg-slate-800/70" />
                <div className="h-16 rounded bg-slate-800/60" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur">
              <div className="mb-4 h-5 w-40 rounded bg-slate-800/80" />
              <div className="space-y-3">
                <div className="h-4 w-64 rounded bg-slate-800/70" />
                <div className="h-4 w-56 rounded bg-slate-800/70" />
                <div className="h-4 w-52 rounded bg-slate-800/70" />
                <div className="h-10 w-full rounded bg-slate-800/60" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, chip) => (
                    <div
                      key={chip}
                      className="h-6 w-20 rounded-full bg-slate-800/60"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Account info */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur">
            <div className="mb-4 h-5 w-44 rounded bg-slate-800/80" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-slate-800/70" />
                <div className="h-4 w-24 rounded bg-slate-800/60" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-40 rounded bg-slate-800/70" />
                <div className="h-4 w-28 rounded bg-slate-800/60" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-48 rounded bg-slate-800/70" />
                <div className="h-4 w-20 rounded bg-slate-800/60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'profile-edit') {
    return (
      <div
        className={`min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-10 ${className}`}
        data-testid="skeleton"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 animate-pulse">
          <div className="space-y-2">
            <div className="h-3 w-52 rounded bg-slate-800/70" />
            <div className="h-7 w-72 rounded bg-slate-800/80" />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur">
            <div className="mb-4 h-5 w-40 rounded bg-slate-800/80" />
            <div className="space-y-3">
              <div className="h-11 w-full rounded-lg bg-slate-800/60" />
              <div className="h-11 w-full rounded-lg bg-slate-800/60" />
              <div className="h-11 w-full rounded-lg bg-slate-800/60" />
              <div className="h-24 w-full rounded-lg bg-slate-800/50" />
              <div className="h-4 w-32 rounded bg-slate-800/60" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur">
            <div className="mb-4 h-5 w-44 rounded bg-slate-800/80" />
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-11 w-full rounded-lg bg-slate-800/60" />
              ))}
            </div>
            <div className="mt-4 space-y-3">
              <div className="h-11 w-full rounded-lg bg-slate-800/60" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-slate-800/60" />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="h-8 rounded-lg bg-slate-800/60" />
                  ))}
                </div>
              </div>
              <div className="h-11 w-full rounded-lg bg-slate-800/60" />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <div className="h-11 w-32 rounded-xl bg-slate-200/40" />
            <div className="h-11 w-32 rounded-xl bg-slate-800/60" />
          </div>

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
        className={`min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,_#1e293b,_#020617)] px-4 py-16 text-slate-100 ${className}`}
        data-testid="skeleton"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          {/* Hero */}
          <div className="flex animate-pulse flex-col gap-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl backdrop-blur-sm sm:flex-row sm:items-center">
            <div className="flex justify-center sm:block sm:w-48">
              <div className="h-48 w-40 rounded-xl bg-slate-800 sm:h-56 sm:w-44" />
            </div>
            <div className="flex flex-1 flex-col gap-4">
              <div className="h-6 w-40 rounded bg-slate-800/80" />
              <div className="h-8 w-3/4 rounded bg-slate-800/80" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="h-10 rounded-xl bg-slate-800/70" />
                <div className="h-10 rounded-xl bg-slate-800/70" />
                <div className="h-10 rounded-xl bg-slate-800/70" />
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="h-6 w-28 rounded-full bg-slate-800/80" />
                <div className="h-6 w-32 rounded-full bg-slate-800/80" />
                <div className="h-6 w-24 rounded-full bg-slate-800/80" />
              </div>
            </div>
          </div>

          {/* Info + trophies */}
          <div className="grid animate-pulse gap-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur-sm md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-slate-800/80" />
                <div className="h-5 w-36 rounded bg-slate-800/80" />
              </div>
              <div className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
                <div className="h-4 w-3/4 rounded bg-slate-800" />
                <div className="h-4 w-2/3 rounded bg-slate-800/90" />
                <div className="h-4 w-5/6 rounded bg-slate-800/70" />
                <div className="h-4 w-1/2 rounded bg-slate-800/70" />
                <div className="h-4 w-4/6 rounded bg-slate-800/80" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <div className="h-6 w-20 rounded-full bg-slate-800/80" />
                  <div className="h-6 w-24 rounded-full bg-slate-800/70" />
                  <div className="h-6 w-16 rounded-full bg-slate-800/60" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
              <div className="h-5 w-32 rounded bg-slate-800/80" />
              <div className="space-y-3 pt-1">
                <div className="h-4 w-full rounded bg-slate-800" />
                <div className="h-4 w-5/6 rounded bg-slate-800/90" />
                <div className="h-4 w-4/6 rounded bg-slate-800/80" />
                <div className="h-4 w-3/4 rounded bg-slate-800/70" />
              </div>
            </div>
          </div>

          {/* Guides */}
          <div className="space-y-4 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-5 w-24 rounded bg-slate-800/80" />
                <div className="h-3 w-40 rounded bg-slate-800/60" />
              </div>
              <div className="h-4 w-28 rounded bg-slate-800/60" />
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 shadow-inner shadow-slate-900/40">
              <div className="h-4 w-20 rounded bg-slate-800/80" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-slate-800/70" />
                <div className="h-3 w-5/6 rounded bg-slate-800/60" />
                <div className="h-3 w-2/3 rounded bg-slate-800/50" />
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 shadow-inner shadow-slate-900/40">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-xl border border-slate-800/70 bg-slate-950/50 p-4 shadow"
                  data-testid="skeleton-item"
                >
                  <div className="h-4 w-2/3 rounded bg-slate-800/80" />
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-slate-800/70" />
                    <div className="h-3 w-5/6 rounded bg-slate-800/70" />
                    <div className="h-3 w-3/4 rounded bg-slate-800/60" />
                    <div className="h-3 w-2/3 rounded bg-slate-800/50" />
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
