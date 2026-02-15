import {
  Layers,
  ListTodo,
  BarChart3,
  Star,
  StickyNote,
  Trophy,
  Film,
  RefreshCw,
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

export function AboutFeatures() {
  return (
    <section className="px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-screen-2xl">
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-primary">
            What&apos;s implemented
          </p>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Core features available today
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            These are the features that exist and work right now. Not a roadmap—actual
            functionality.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(feature => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
