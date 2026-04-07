import {
  Layers,
  ListTodo,
  BarChart3,
  Trophy,
  StickyNote,
  Film,
  NotebookPen,
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
    title: 'All Hobbies, One Library',
    description:
      'Games, anime, manga, books, movies, TV shows — everything in one place. No more switching between five different apps.',
    icon: <Layers className="h-6 w-6" />,
  },
  {
    title: 'Progress Tracking',
    description:
      'Update hours played, episodes watched, chapters read, or pages finished as you go. Pick up exactly where you left off.',
    icon: <ListTodo className="h-6 w-6" />,
  },
  {
    title: 'Personal Statistics',
    description:
      'See how much time you invest in each hobby, your completion rate, and what you have in progress.',
    icon: <BarChart3 className="h-6 w-6" />,
  },
  {
    title: 'Ratings & Reflections',
    description:
      'Rate entries on a 1–10 scale and write short notes to capture your thoughts while they are still fresh.',
    icon: <Star className="h-6 w-6" />,
  },
  {
    title: 'Private Diary',
    description:
      'A dedicated space for personal journal entries, encrypted locally on your device. Only you can read it.',
    icon: <NotebookPen className="h-6 w-6" />,
  },
  {
    title: 'Smart Status & Backlog',
    description:
      'Organize everything with Planned, Current, Completed, or Dropped. Your backlog stays under control.',
    icon: <StickyNote className="h-6 w-6" />,
  },
  {
    title: 'Steam Import',
    description:
      'Connect Steam and import your full game library with playtime. Your backlog appears in seconds.',
    icon: <Trophy className="h-6 w-6" />,
  },
  {
    title: 'Smart Recommendations',
    description:
      'Get suggestions based on your actual taste — genres, themes, and ratings you have already given across all your hobbies.',
    icon: <Film className="h-6 w-6" />,
  },
  {
    title: 'Works Offline',
    description:
      'Hobbistas is a PWA — install it on your phone or desktop and keep tracking even without an internet connection.',
    icon: <RefreshCw className="h-6 w-6" />,
  },
];

export function HomeFeatures() {
  return (
    <section className="px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-screen-2xl">
        <div className="mb-10 text-center md:mb-12">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-foreground/80">
            Everything you need
          </p>
          <h2 className="mb-4 text-3xl font-semibold text-foreground md:text-4xl">
            One app, every hobby
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Everything you need to track, organize, and discover across all your hobbies — free.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(feature => (
            <div
              key={feature.title}
              className="group rounded-lg p-6 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border bg-card text-primary transition-colors group-hover:bg-primary/10">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-base font-semibold tracking-[-0.01em] text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
