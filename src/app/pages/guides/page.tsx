'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, ChevronDown, Plus } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import AlertMessage from '@/app/components/ui/AlertMessage';
import GameGrid from '@/app/components/guides/GameGrid';
import Skeleton from '@/app/components/ui/Skeleton';
import { RootState } from '@/store/store';
import { useGetGamesQuery } from '@/store/api/gamesApi';
import { parseError } from '@/utils/error/parseError';
import { setProcessedGames } from '@/store/slices/processedGamesSlice';
import { resetGenre } from '@/store/slices/genresSlice';
import { resetDeveloper } from '@/store/slices/developerSlice';
import { resetDifficulty } from '@/store/slices/difficultySlice';
import { resetPlatform } from '@/store/slices/platformsSlice';
import { SearchBar } from '@/app/components/ui/SearchBar';
import FiltersPanel from '@/app/components/filters/FiltersPanel';

export default function Guides() {
  const dispatch = useDispatch();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [difficultyCategory, setDifficultyCategory] = useState<'easy' | 'medium' | 'hard' | null>(
    null,
  );

  const [hourRange, setHourRange] = useState<[number, number]>([0, 1000]);
  const [yearRange, setYearRange] = useState<[number, number]>([1990, 2025]);

  const [isOpen, setIsOpen] = useState(false);

  const { data: games, error, isLoading } = useGetGamesQuery();

  // Calculate dynamic min/max values from games data
  const { minYear, maxYear, minHour, maxHour } = useMemo(() => {
    if (!games?.games || games.games.length === 0) {
      return { minYear: 1990, maxYear: new Date().getFullYear(), minHour: 0, maxHour: 200 };
    }

    const years = games.games
      .map(game => game.release_year)
      .filter((year): year is number => year !== null && year !== undefined);
    const hours = games.games
      .map(game => game.average_hours)
      .filter((hour): hour is number => hour !== null && hour !== undefined);

    return {
      minYear: years.length > 0 ? Math.min(...years) : 1990,
      maxYear: years.length > 0 ? Math.max(...years) : new Date().getFullYear(),
      minHour: hours.length > 0 ? Math.floor(Math.min(...hours)) : 0,
      maxHour: hours.length > 0 ? Math.ceil(Math.max(...hours)) : 200,
    };
  }, [games]);

  const platformFilter = useSelector((state: RootState) => state.platforms.selectedPlatform);
  const genreFilter = useSelector((state: RootState) => state.genres.selectedGenre);
  const developerFilter = useSelector((state: RootState) => state.developer.selectedDeveloper);
  const difficultyFilter = useSelector((state: RootState) => state.difficulty.selectedDifficulty);

  useEffect(() => {
    if (games) {
      dispatch(setProcessedGames(games.games));
    }
  }, [games, dispatch]);

  // Initialize ranges when data first loads
  useEffect(() => {
    if (games && hourRange[0] === 0 && hourRange[1] === 1000) {
      setHourRange([minHour, maxHour]);
    }
    if (games && yearRange[0] === 1990 && yearRange[1] === 2025) {
      setYearRange([minYear, maxYear]);
    }
  }, [games, minHour, maxHour, minYear, maxYear, hourRange, yearRange]);

  // Helper function to check if search matches whole words or start of title
  const matchesSearch = (title: string, searchTerm: string) => {
    if (!searchTerm) return true;
    const lowerTitle = title.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();

    // Check if it starts with the search term
    if (lowerTitle.startsWith(lowerSearch)) return true;

    // Check if any word starts with the search term
    const words = lowerTitle.split(/\s+/);
    return words.some(word => word.startsWith(lowerSearch));
  };

  const filteredGames = games?.games

    ?.filter(
      game =>
        matchesSearch(game.title, search) &&
        (!platformFilter || game.platforms?.includes(platformFilter)) &&
        (!developerFilter || game.developer === developerFilter) &&
        (!genreFilter || game.genres?.includes(genreFilter)) &&
        (() => {
          // priority: explicit difficulty filter; else category presets; else pass
          if (difficultyFilter !== null) {
            if (difficultyFilter === 0) return true;
            return (game.average_difficulty ?? 0) === difficultyFilter;
          }
          if (difficultyCategory === 'easy') return (game.average_difficulty ?? 0) <= 3;
          if (difficultyCategory === 'hard') return (game.average_difficulty ?? 0) >= 7;
          if (difficultyCategory === 'medium')
            return (game.average_difficulty ?? 0) > 3 && (game.average_difficulty ?? 0) < 7;
          return true;
        })() &&
        (game.average_hours ?? 0) >= hourRange[0] &&
        (game.average_hours ?? 0) <= hourRange[1] &&
        (yearRange[0] === minYear && yearRange[1] === maxYear
          ? true // If filter is at max range, include all games
          : game.release_year &&
            game.release_year >= yearRange[0] &&
            game.release_year <= yearRange[1]),
    )
    ?.sort((a, b) => {
      if (sortBy === 'title') {
        return sortOrder === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }

      if (sortBy === 'difficulty') {
        return sortOrder === 'asc'
          ? (a.average_difficulty ?? 0) - (b.average_difficulty ?? 0)
          : (b.average_difficulty ?? 0) - (a.average_difficulty ?? 0);
      }

      if (sortBy === 'hours') {
        return sortOrder === 'asc'
          ? (a.average_hours ?? 0) - (b.average_hours ?? 0)
          : (b.average_hours ?? 0) - (a.average_hours ?? 0);
      }

      if (sortBy === 'rating') {
        return sortOrder === 'asc'
          ? (a.rating ?? 0) - (b.rating ?? 0)
          : (b.rating ?? 0) - (a.rating ?? 0);
      }

      if (sortBy === 'totalPoints') {
        return sortOrder === 'asc'
          ? (a.totalPoints ?? 0) - (b.totalPoints ?? 0)
          : (b.totalPoints ?? 0) - (a.totalPoints ?? 0);
      }

      if (sortBy === 'releaseYear') {
        return sortOrder === 'asc'
          ? (a.release_year ?? 0) - (b.release_year ?? 0)
          : (b.release_year ?? 0) - (a.release_year ?? 0);
      }

      return 0;
    });

  const handleResetFilters = () => {
    setYearRange([minYear, maxYear]);
    setHourRange([minHour, maxHour]);
    setSortBy('title');
    setSortOrder('asc');
    setDifficultyCategory(null);
    dispatch(resetPlatform());
    dispatch(resetGenre());
    dispatch(resetDeveloper());
    dispatch(resetDifficulty());
  };

  const content = () => {
    if (isLoading) {
      return <Skeleton type="grid" />;
    }
    if (filteredGames && filteredGames.length > 0) return <GameGrid games={filteredGames || []} />;
    return <p className="mt-6 text-center text-lg text-gray-400">Δεν βρέθηκαν παιχνίδια.</p>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-16 text-slate-100">
      <div className="relative mx-auto flex max-w-7xl flex-col gap-10">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute right-0 top-32 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute bottom-10 left-1/2 h-24 w-48 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/60 px-6 py-8 shadow-2xl shadow-blue-900/40 backdrop-blur-xl md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-sky-400 to-emerald-300 text-slate-950 shadow-lg shadow-blue-500/30">
                  <BookOpen className="h-6 w-6" />
                </span>
                Οδηγοί
              </h1>
              <p className="max-w-2xl text-lg text-slate-300">
                Για trophy hunters που θέλουν καθαρή, γρήγορη και αξιόπιστη πληροφόρηση. Βρες τον
                επόμενο στόχο σου και ξεκίνα το κυνήγι για πλατίνα.
              </p>
              {error && <AlertMessage type="error" message={parseError(error)} />}
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 shadow-inner shadow-slate-950/30">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Guides</p>
                  <p className="text-center text-2xl font-semibold text-white">
                    {games?.games?.length ?? '–'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 shadow-inner shadow-slate-950/30">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Developer</p>
                  <p className="text-center text-2xl font-semibold text-sky-300">
                    {games?.games
                      ? new Set(games.games.flatMap(g => g.developer || [])).size || '–'
                      : '–'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 shadow-inner shadow-slate-950/30">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Genres</p>
                  <p className="text-center text-2xl font-semibold text-sky-300">
                    {games?.games
                      ? new Set(games.games.flatMap(g => g.genres || [])).size || '–'
                      : '–'}
                  </p>
                </div>
              </div>
              {process.env.NODE_ENV !== 'production' && (
                <Link
                  href="/pages/guides/create"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-blue-500 to-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-blue-500/30 transition hover:shadow-blue-400/40"
                >
                  <Plus className="h-4 w-4" />
                  Δημιουργία νέου guide
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="relative grid gap-4 lg:grid-cols-[320px,1fr]">
          {/* Filters - desktop sticky */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <FiltersPanel
                isOpen
                hourRange={hourRange}
                setHourRange={setHourRange}
                yearRange={yearRange}
                setYearRange={setYearRange}
                minHour={minHour}
                maxHour={maxHour}
                minYear={minYear}
                maxYear={maxYear}
                onResetFilters={handleResetFilters}
                onClose={() => {}}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={setSortBy}
                onOrderChange={value => setSortOrder(value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            {/* Mobile filters + controls */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 shadow-lg shadow-slate-900/40 backdrop-blur-xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Αναζήτηση οδηγού..."
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  {[
                    { label: 'Εύκολες πλατίνες', value: 'easy' as const, desc: 'Γρήγορα runs' },
                    { label: 'Μέτριες πλατίνες', value: 'medium' as const, desc: 'Ισορροπημένα' },
                    { label: 'Δύσκολες πλατίνες', value: 'hard' as const, desc: 'Για πρόκληση' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setDifficultyCategory(prev => (prev === option.value ? null : option.value))
                      }
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        difficultyCategory === option.value
                          ? 'border-sky-400/70 bg-sky-500/10 text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.35)]'
                          : 'border-slate-800/70 bg-slate-950/70 text-slate-100 hover:border-sky-400/60 hover:text-white'
                      }`}
                    >
                      <span className="flex flex-col items-start leading-tight">
                        <span>{option.label}</span>
                        <span className="text-[11px] text-slate-400">{option.desc}</span>
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 rounded-xl border border-slate-800/70 bg-slate-950/70 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/70 hover:text-white lg:hidden"
                  >
                    Φίλτρα
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              </div>

              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 40 }}
                className="overflow-hidden lg:hidden"
              >
                <div className="pt-2">
                  <FiltersPanel
                    isOpen={isOpen}
                    hourRange={hourRange}
                    setHourRange={setHourRange}
                    yearRange={yearRange}
                    setYearRange={setYearRange}
                    minHour={minHour}
                    maxHour={maxHour}
                    minYear={minYear}
                    maxYear={maxYear}
                    onResetFilters={handleResetFilters}
                    onClose={() => setIsOpen(false)}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={setSortBy}
                    onOrderChange={value => setSortOrder(value)}
                  />
                </div>
              </motion.div>
            </div>

            <motion.div
              key={`${sortOrder}-${sortBy}-${hourRange}-${yearRange}-${platformFilter}-${genreFilter}-${developerFilter}-${difficultyFilter}-${difficultyCategory}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 40,
                duration: 0.4,
              }}
              className="w-full"
            >
              {content()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
