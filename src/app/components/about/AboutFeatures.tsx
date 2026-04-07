import {
  Layers,
  ListTodo,
  BarChart3,
  Star,
  StickyNote,
  Trophy,
  Film,
  NotebookPen,
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
    title: 'All Hobbies, One Library',
    description:
      'Games, anime, manga, books, movies, and TV shows — all tracked in one place instead of five different apps.',
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
    description:
      'See time invested, completion rates, and in-progress counts per category at a glance.',
    icon: <BarChart3 className="h-6 w-6" />,
  },
  {
    title: 'Ratings & Reflections',
    description:
      'Rate entries on a 1–10 scale and write short notes to remember your thoughts on each one.',
    icon: <Star className="h-6 w-6" />,
  },
  {
    title: 'Private Diary',
    description:
      'Write personal journal entries encrypted locally on your device. The server never sees the content.',
    icon: <NotebookPen className="h-6 w-6" />,
  },
  {
    title: 'Smart Status & Backlog',
    description:
      'Keep your library organized with Planned, Current, Completed, and Dropped. Mark favorites.',
    icon: <StickyNote className="h-6 w-6" />,
  },
  {
    title: 'Steam Import',
    description:
      'Connect your Steam account and import your full game library with playtime in seconds.',
    icon: <Trophy className="h-6 w-6" />,
  },
  {
    title: 'Smart Recommendations',
    description:
      'Get suggestions based on the genres, themes, and ratings from your actual library — not what is trending.',
    icon: <Film className="h-6 w-6" />,
  },
  {
    title: 'Works Offline (PWA)',
    description:
      'Install Hobbistas on your phone or desktop. Your library stays accessible even without an internet connection.',
    icon: <RefreshCw className="h-6 w-6" />,
  },
];

export function AboutFeatures() {
  return (
    <section className="px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-screen-2xl">
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-primary">
            What you get
          </p>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Everything in one place
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            All of this is available right now, for free. No setup required beyond creating an account.
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
