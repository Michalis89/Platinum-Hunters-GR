import Link from 'next/link';
import { Gamepad2, Sparkles, BookOpen, Film, Tv, BookText } from 'lucide-react';
import type { CategoryStats, PersonalStats } from './types';
import type { ReactNode } from 'react';

type HeroCategoryKey = 'games' | 'anime' | 'manga' | 'movies' | 'tv' | 'books';

type HeroPreset = {
  key: HeroCategoryKey;
  label: string;
  icon: ReactNode;
  description: string;
  href: string;
};

const CATEGORY_PRESETS: HeroPreset[] = [
  {
    key: 'games',
    label: 'Games',
    icon: <Gamepad2 className="h-5 w-5" />,
    description: 'Συνέχισε το επόμενο επεισόδιο ή το Boss fight.',
    href: '/pages/backlog?category=games&status=current',
  },
  {
    key: 'anime',
    label: 'Anime',
    icon: <Sparkles className="h-5 w-5" />,
    description: 'Επιστρέψε στην σειρά που σε κράτησε ξύπνιο.',
    href: '/pages/backlog?category=anime&status=current',
  },
  {
    key: 'manga',
    label: 'Manga',
    icon: <BookOpen className="h-5 w-5" />,
    description: 'Απόκτησε προσοχή στα chapters που είναι στη μέση.',
    href: '/pages/backlog?category=manga&status=current',
  },
  {
    key: 'movies',
    label: 'Ταινίες',
    icon: <Film className="h-5 w-5" />,
    description: 'Τρέξε το επόμενο cinephile binge.',
    href: '/pages/backlog?category=movies&status=planned',
  },
  {
    key: 'tv',
    label: 'Σειρές',
    icon: <Tv className="h-5 w-5" />,
    description: 'Συνέχισε τις σειράς σου, ένα επεισόδιο τη φορά.',
    href: '/pages/backlog?category=tv&status=current',
  },
  {
    key: 'books',
    label: 'Βιβλία',
    icon: <BookText className="h-5 w-5" />,
    description: 'Πάρε θέση στο bookmark σου και συνέχισε τη σελίδα.',
    href: '/pages/backlog?category=books&status=current',
  },
];

type HomeHeroActionCardProps = {
  stats?: PersonalStats;
};

export function HomeHeroActionCard({ stats }: HomeHeroActionCardProps) {
  const getCategoryStats = (key: HeroCategoryKey): CategoryStats | undefined =>
    stats ? (stats[key] as CategoryStats) : undefined;

  const recentCategory =
    CATEGORY_PRESETS.find(entry => (getCategoryStats(entry.key)?.in_progress ?? 0) > 0) ??
    CATEGORY_PRESETS.find(entry => stats?.active_categories?.includes(entry.key)) ??
    CATEGORY_PRESETS[0];

  const highlightStat = getCategoryStats(recentCategory.key);
  const playingText =
    highlightStat && highlightStat.in_progress > 0
      ? `Παίζεις τώρα: ${highlightStat.in_progress} ${recentCategory.label.toLowerCase()}`
      : `Πρόσθεσε ${recentCategory.label.toLowerCase()} για να ξεκινήσεις`;
  const totalText =
    highlightStat && highlightStat.total > 0
      ? `Σύνολο: ${highlightStat.total}`
      : 'Δεν υπάρχουν δεδομένα ακόμα';
  const lastPlayed =
    highlightStat && highlightStat.hours > 0
      ? `Τελευταία καταγραφή: ${highlightStat.hours} ώρες`
      : 'Χωρίς καταγραφή χρόνου';
  const nextStep =
    highlightStat && highlightStat.in_progress > 0
      ? 'Επόμενο βήμα: συνέχισε την τρέχουσα ενότητα'
      : 'Πρόσθεσε κάτι νέο στο backlog';

  return (
    <section className="px-4 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-md md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
              Το επόμενο βήμα
            </p>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Συνέχισε από εκεί που σταμάτησες
            </h2>
            <p className="text-sm text-muted-foreground">{playingText}</p>
            <p className="text-lg font-semibold text-foreground">
              {recentCategory.label}
            </p>
            <p className="text-sm text-muted-foreground">{recentCategory.description}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={recentCategory.href}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-foreground transition duration-300 hover:shadow-md hover:brightness-110"
              >
                Συνέχεια
                <span aria-hidden="true">→</span>
              </Link>
              <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="text-primary">{recentCategory.icon}</span>
                Latest backlog focus
              </div>
            </div>
          </div>
          <div className="from-primary/30 relative rounded-2xl border border-border bg-gradient-to-br to-transparent p-4 text-foreground">
            <div className="flex h-full flex-col justify-between gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-black/70 via-black/40 to-transparent p-4 shadow-inner shadow-black/60">
                <div className="flex items-center gap-3 text-white">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
                    {recentCategory.icon}
                  </span>
                  <div>
                    <p className="text-sm uppercase tracking-[0.4em] text-white/60">Thumbnail</p>
                    <p className="text-lg font-semibold text-white">{recentCategory.label}</p>
                    <p className="text-xs text-white/60">{playingText}</p>
                  </div>
                </div>
                <div className="mt-4 h-32 w-full rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-transparent" />
              </div>
              <div className="text-sm text-white/80">
                <p className="text-lg font-bold text-white">{totalText}</p>
                <p className="mt-1 text-xs">{lastPlayed}</p>
                <p className="mt-1 text-xs">{nextStep}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
