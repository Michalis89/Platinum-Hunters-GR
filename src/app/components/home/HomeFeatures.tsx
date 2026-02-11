import {
  Layers,
  ListTodo,
  BarChart3,
  Trophy,
  StickyNote,
  Film,
  RefreshCw,
  Star,
} from 'lucide-react';
import type { ReactNode } from 'react';

type Feature = {
  title: string;
  description: string;
  icon: ReactNode;
};
const features: Feature[] = [
  {
    title: 'Personal Library',
    description:
      'Track games, anime, manga, books, movies, and TV shows. Add items manually or import from supported sources.',
    icon: <Layers className="h-6 w-6" />,
  },
  {
    title: 'Progress Tracking',
    description:
      'Update hours played, episodes watched, chapters read, or pages finished as you go.',
    icon: <ListTodo className="h-6 w-6" />,
  },
  {
    title: 'Personal Statistics',
    description: 'View time invested, completion status, and in-progress counts per category.',
    icon: <BarChart3 className="h-6 w-6" />,
  },
  {
    title: 'Ratings & Reflections',
    description:
      'Rate each entry on a 1–10 scale and add short reflections to capture your thoughts.',
    icon: <Star className="h-6 w-6" />,
  },
  {
    title: 'Status Management',
    description:
      'Organize your library with statuses: Planned, Current, Completed, or Dropped. Mark favorites.',
    icon: <StickyNote className="h-6 w-6" />,
  },
  {
    title: 'Gaming Fields',
    description:
      'Select platforms, import playtime from Steam, and set personal difficulty ratings for games.',
    icon: <Trophy className="h-6 w-6" />,
  },
  {
    title: 'Articles & Reviews (Optional)',
    description:
      'Optional module enabled in Application Settings. Users with Author or Reviewer roles can publish content; likes and comments are available when the module is active. Role access is managed through Support.',
    icon: <Film className="h-6 w-6" />,
  },
  {
    title: 'External Library Sync',
    description:
      'Import your Steam library with playtime. Anime and manga sync from MyAnimeList is being finalized.',
    icon: <RefreshCw className="h-6 w-6" />,
  },
];

export function HomeFeatures() {
  return (
    <section className="px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center md:mb-12">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--apple-system-blue)]">
            Capabilities
          </p>
          <h2 className="apple-title-tracking mb-4 text-3xl font-semibold text-[var(--apple-label)] md:text-4xl">
            Everything you need only what you choose
          </h2>
          <p className="apple-body-tracking mx-auto max-w-xl text-[var(--apple-secondary-label)]">
            A personal hobby system that stays out of your way. No feeds. No noise. No assumptions.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(feature => (
            <div
              key={feature.title}
              className="apple-card group rounded-[var(--apple-radius-card)] p-6 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--apple-system-blue)_34%,transparent)] hover:shadow-[var(--hb-shadow-md-hover)]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)] text-[var(--apple-system-blue)] transition-colors group-hover:bg-[color-mix(in_srgb,var(--apple-system-blue)_12%,transparent)]">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-base font-semibold tracking-[-0.01em] text-[var(--apple-label)]">
                {feature.title}
              </h3>
              <p className="apple-body-tracking text-sm leading-relaxed text-[var(--apple-secondary-label)]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
