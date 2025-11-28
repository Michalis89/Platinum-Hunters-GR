'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { BookOpen, ChevronDown, Plus } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import AlertMessage from '@/app/components/ui/AlertMessage';
import GameGrid from '@/app/components/guides/GameGrid';
import GameListRow from '@/app/components/guides/GameListRow';
import Skeleton from '@/app/components/ui/Skeleton';
import { AppDispatch, RootState } from '@/store/store';
import { useGetGamesQuery } from '@/store/api/gamesApi';
import {
  fetchBacklog,
  selectBacklogError,
  selectBacklogItems,
  selectBacklogLoading,
} from '@/store/slices/backlogSlice';
import { ProcessedGame } from '@/types/interfaces';
import { parseError } from '@/utils/error/parseError';
import { setProcessedGames } from '@/store/slices/processedGamesSlice';
import { resetGenre } from '@/store/slices/genresSlice';
import { resetDeveloper } from '@/store/slices/developerSlice';
import { resetDifficulty } from '@/store/slices/difficultySlice';
import { resetPlatform } from '@/store/slices/platformsSlice';
import { SearchBar } from '@/app/components/ui/SearchBar';
import FiltersPanel from '@/app/components/filters/FiltersPanel';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import Feedback from '@/app/components/ui/Feedback';

type GuidesViewMode = 'grid' | 'list' | 'compact' | 'timeline';

export default function Guides() {
  const dispatch = useDispatch<AppDispatch>();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [difficultyCategory, setDifficultyCategory] = useState<'easy' | 'medium' | 'hard' | null>(
    null,
  );

  const [hourRange, setHourRange] = useState<[number, number]>([1, 1000]);
  const [runValue, setRunValue] = useState<number>(0);
  const [yearRange, setYearRange] = useState<[number, number]>([1990, 2025]);
  const [baseYearRange, setBaseYearRange] = useState<[number, number]>([
    1990,
    new Date().getFullYear(),
  ]);
  const [hasInitializedRanges, setHasInitializedRanges] = useState(false);
  const [showBacklogErrorOverlay, setShowBacklogErrorOverlay] = useState(false);
  const [page, setPage] = useState(1);
  const [combinedGames, setCombinedGames] = useState<ProcessedGame[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [hasUserFiltered, setHasUserFiltered] = useState(false);
  const lastScrollYRef = useRef(0);
  const prevMaxHourRef = useRef(0);
  const metaYearRangeRef = useRef<[number, number] | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<GuidesViewMode>(() => {
    if (globalThis.window === undefined) return 'grid';
    const stored = globalThis.window.localStorage.getItem('guidesViewMode');
    return stored === 'list' || stored === 'compact' || stored === 'timeline'
      ? (stored as GuidesViewMode)
      : 'grid';
  });

  const platformFilter = useSelector((state: RootState) => state.platforms.selectedPlatform);
  const genreFilter = useSelector((state: RootState) => state.genres.selectedGenre);
  const developerFilter = useSelector((state: RootState) => state.developer.selectedDeveloper);
  const difficultyFilter = useSelector((state: RootState) => state.difficulty.selectedDifficulty);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const backlogItems = useSelector(selectBacklogItems);
  const backlogError = useSelector(selectBacklogError);
  const backlogLoading = useSelector(selectBacklogLoading);
  const hasRequestedBacklog = useRef(false);

  // Reset pagination when filters change
  useEffect(() => {
    if (!hasInitializedRanges) return;
    setPage(1);
    setCombinedGames([]);
    setHasMore(true);
  }, [hasInitializedRanges, search, platformFilter, genreFilter, developerFilter, yearRange]);

  // When store-based filters change from defaults, mark filters as active
  useEffect(() => {
    if (platformFilter || genreFilter || developerFilter || difficultyFilter !== null) {
      setHasUserFiltered(true);
    }
  }, [platformFilter, genreFilter, developerFilter, difficultyFilter]);

  // Debounce search input -> search term
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 320);
    return () => clearTimeout(id);
  }, [searchInput]);

  const getRunValue = (game: ProcessedGame): number | null => {
    if (typeof game.average_playthroughs === 'number') return game.average_playthroughs;
    if (typeof game.max_playthroughs === 'number') return game.max_playthroughs;

    const estimatedPlaythroughs = (game as { estimated_playthroughs?: number | null })
      .estimated_playthroughs;
    if (typeof estimatedPlaythroughs === 'number') return estimatedPlaythroughs;

    const parsed = Number.parseInt((game as { playthroughs?: string }).playthroughs ?? '', 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  // Calculate dynamic min/max values from loaded games data
  const { minYear, maxYear, minHour, maxHour, minRun, maxRun } = useMemo(() => {
    const dataset = combinedGames.length > 0 ? combinedGames : [];
    if (dataset.length === 0) {
      return {
        minYear: baseYearRange[0],
        maxYear: baseYearRange[1],
        minHour: 0,
        maxHour: 200,
        minRun: 0,
        maxRun: 10,
      };
    }

    const years = dataset
      .map(game => game.release_year)
      .filter((year): year is number => year !== null && year !== undefined);
    const hours = dataset
      .map(game => game.average_hours)
      .filter((hour): hour is number => hour !== null && hour !== undefined);
    const metaMaxHours = 0;
    const runs = dataset
      .map(game => getRunValue(game))
      .filter((run): run is number => run !== null && !Number.isNaN(run));
    const maxRunValue = runs.length > 0 ? Math.max(...runs.map(run => Math.ceil(run))) : 10;

    return {
      minYear: years.length > 0 ? Math.min(...years) : baseYearRange[0],
      maxYear: years.length > 0 ? Math.max(...years) : baseYearRange[1],
      minHour: hours.length > 0 ? Math.floor(Math.min(...hours)) : 0,
      maxHour: Math.max(
        hours.length > 0 ? Math.ceil(Math.max(...hours)) : 0,
        Math.ceil(metaMaxHours || 0),
        200,
      ),
      minRun: 0,
      maxRun: Math.max(1, maxRunValue),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinedGames]);

  const {
    data: games,
    error,
    isLoading,
    isFetching,
  } = useGetGamesQuery({
    page,
    limit: 500,
    search,
    platform: platformFilter || undefined,
    genre: genreFilter || undefined,
    developer: developerFilter || undefined,
    minYear: hasInitializedRanges && yearRange[0] !== baseYearRange[0] ? yearRange[0] : undefined,
    maxYear: hasInitializedRanges && yearRange[1] !== baseYearRange[1] ? yearRange[1] : undefined,
  });

  useEffect(() => {
    if (!games?.games) return;
    if (
      !hasInitializedRanges &&
      games.pagination?.meta?.minYearMeta &&
      games.pagination?.meta?.maxYearMeta
    ) {
      const nextRange: [number, number] = [
        games.pagination.meta.minYearMeta,
        games.pagination.meta.maxYearMeta,
      ];
      const prevRange = metaYearRangeRef.current;
      if (!prevRange || nextRange[0] !== prevRange[0] || nextRange[1] !== prevRange[1]) {
        setBaseYearRange(nextRange);
        metaYearRangeRef.current = nextRange;
      }
    }
    setCombinedGames(prev => {
      // If page is 1, replace
      if (page === 1) return games.games;
      const existingIds = new Set(prev.map(g => g.id));
      const merged = [...prev];
      for (const g of games.games) {
        if (!existingIds.has(g.id)) merged.push(g);
      }
      return merged;
    });
    const total = games.pagination?.total ?? 0;
    const currentCount =
      page === 1 ? games.games.length : combinedGames.length + games.games.length;
    setHasMore(currentCount < total);
    if (page > 1 && globalThis.window !== undefined) {
      globalThis.window.scrollTo({ top: lastScrollYRef.current, behavior: 'auto' });
    }
  }, [games, page, combinedGames.length, hasInitializedRanges]);

  useEffect(() => {
    if (combinedGames.length > 0) {
      dispatch(setProcessedGames(combinedGames));
    }
  }, [combinedGames, dispatch]);

  // Fetch backlog once after auth so chips render with correct status
  useEffect(() => {
    if (!isAuthenticated) {
      hasRequestedBacklog.current = false;
      setShowBacklogErrorOverlay(false);
      return;
    }
    if (backlogItems.length > 0) return;
    if (hasRequestedBacklog.current) return;
    if (backlogLoading) return;

    hasRequestedBacklog.current = true;
    dispatch(fetchBacklog({}));
  }, [dispatch, isAuthenticated, backlogItems.length, backlogLoading]);

  useEffect(() => {
    if (backlogError) {
      setShowBacklogErrorOverlay(true);
    } else {
      setShowBacklogErrorOverlay(false);
    }
  }, [backlogError]);

  useEffect(() => {
    if (hasInitializedRanges) return;
    if (combinedGames.length === 0) return;

    setHourRange([minHour, maxHour]);
    setRunValue(0);
    setYearRange([minYear, maxYear]);
    setHasInitializedRanges(true);
  }, [combinedGames, hasInitializedRanges, minHour, maxHour, minRun, maxRun, minYear, maxYear]);

  useEffect(() => {
    setRunValue(prev => {
      if (!Number.isFinite(prev)) return maxRun;
      if (prev > maxRun) return maxRun;
      if (prev < minRun) return minRun; // allows 0 as reset
      return prev;
    });
  }, [minRun, maxRun]);

  useEffect(() => {
    if (globalThis.window === undefined) return;
    globalThis.window.localStorage.setItem('guidesViewMode', viewMode);
  }, [viewMode]);

  // If new data increases maxHour, bump slider upper bound
  useEffect(() => {
    if (!hasInitializedRanges) return;
    if (maxHour > prevMaxHourRef.current) {
      setHourRange(([currentMin]) => [currentMin, maxHour]);
      prevMaxHourRef.current = maxHour;
    }
  }, [maxHour, hasInitializedRanges]);

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

  const filteredGames = hasUserFiltered
    ? combinedGames
        .filter(game => {
          const runStat = getRunValue(game);
          const normalizedRun = runStat === null ? null : Math.round(runStat);
          const matchesRuns =
            !hasInitializedRanges || runValue === 0
              ? true
              : normalizedRun !== null && normalizedRun === runValue;

          const matchesYearRange =
            yearRange[0] === minYear && yearRange[1] === maxYear
              ? true
              : typeof game.release_year === 'number' &&
                game.release_year >= yearRange[0] &&
                game.release_year <= yearRange[1];

          return (
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
            matchesRuns &&
            (game.average_hours ?? 0) >= hourRange[0] &&
            (game.average_hours ?? 0) <= hourRange[1] &&
            matchesYearRange
          );
        })
        .sort((a, b) => {
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
        })
    : combinedGames;

  const timelineGroups = useMemo(() => {
    if (!filteredGames) return [];
    const groups = new Map<string, ProcessedGame[]>();
    for (const game of filteredGames) {
      const key = typeof game.release_year === 'number' ? game.release_year.toString() : 'Unknown';
      const list = groups.get(key) ?? [];
      list.push(game);
      groups.set(key, list);
    }

    const sorted = Array.from(groups.entries()).sort((a, b) => {
      if (a[0] === 'Unknown') return 1;
      if (b[0] === 'Unknown') return -1;
      return Number(b[0]) - Number(a[0]);
    });

    return sorted.map(([year, items]) => ({ year, items }));
  }, [filteredGames]);

  const handleResetFilters = () => {
    setHasUserFiltered(false);
    setYearRange([minYear, maxYear]);
    setHourRange([minHour, maxHour]);
    setRunValue(0);
    setSortBy('title');
    setSortOrder('asc');
    setDifficultyCategory(null);
    dispatch(resetPlatform());
    dispatch(resetGenre());
    dispatch(resetDeveloper());
    dispatch(resetDifficulty());
  };

  const content = () => {
    if (filteredGames && filteredGames.length > 0) {
      if (viewMode === 'timeline') {
        return (
          <div className="min-h-[60vh]">
            <div className="w-full overflow-x-auto pb-2">
              <div className="flex w-fit gap-4 pr-2">
                {timelineGroups.map(group => (
                  <div
                    key={group.year}
                    className="min-w-[240px] rounded-xl border border-slate-800/70 bg-slate-900/60 p-3 shadow-inner shadow-slate-900/30"
                  >
                    <div className="flex items-center justify-between text-sm text-slate-200">
                      <span className="text-base font-semibold text-emerald-200">{group.year}</span>
                      <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-xs text-slate-300">
                        {group.items.length}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {group.items.map(game => (
                        <Link
                          key={game.id}
                          href={`/pages/guides/${game.slug}`}
                          className="group flex items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-950/60 p-2 text-xs text-slate-200 transition hover:border-emerald-400/60"
                        >
                          <div className="relative h-12 w-12 overflow-hidden rounded-md bg-slate-800">
                            <Image
                              src={game.cover_image || game.background_image || '/og-image.png'}
                              alt={game.title}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold group-hover:text-emerald-200">
                              {game.title}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">
                              {game.platforms?.slice(0, 2).join(' • ') || 'N/A'}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-[60vh] max-h-[80vh] overflow-y-auto pr-1">
          {viewMode === 'grid' ? (
            <GameGrid games={filteredGames || []} />
          ) : (
            <div className="space-y-2">
              {filteredGames.map(game => (
                <GameListRow key={game.id} game={game} compact={viewMode === 'compact'} />
              ))}
            </div>
          )}
        </div>
      );
    }
    if (isFetching || isLoading) return <Skeleton type="guides-list" />;
    return <p className="mt-6 text-center text-lg text-gray-400">Δεν βρέθηκαν παιχνίδια.</p>;
  };

  if (isLoading) {
    return <Skeleton type="guides-list" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-16 text-slate-100">
      {showBacklogErrorOverlay && backlogError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-xl px-4">
            <Feedback
              variant="error"
              tone="solid"
              layout="inline"
              title="Αδυναμία φόρτωσης backlog"
              description="To παιχνίδι δεν προσθεθηκε στο backlog."
              actionLabel={backlogLoading ? 'Προσπάθεια...' : 'Δοκίμασε ξανά'}
              onAction={() => {
                if (!isAuthenticated) return;
                dispatch(fetchBacklog({}));
              }}
              dismissible
              onDismiss={() => setShowBacklogErrorOverlay(false)}
              className="shadow-2xl shadow-red-500/20"
            />
          </div>
        </div>
      )}
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
                    {(games?.pagination?.total ?? combinedGames.length) || '–'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 shadow-inner shadow-slate-950/30">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Developer</p>
                  <p className="text-center text-2xl font-semibold text-sky-300">
                    {games?.pagination?.meta?.developersCount ??
                      (combinedGames.length > 0
                        ? new Set(combinedGames.flatMap(g => g.developer || [])).size || '–'
                        : '–')}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 shadow-inner shadow-slate-950/30">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Genres</p>
                  <p className="text-center text-2xl font-semibold text-sky-300">
                    {games?.pagination?.meta?.genresCount ??
                      (combinedGames.length > 0
                        ? new Set(combinedGames.flatMap(g => g.genres || [])).size || '–'
                        : '–')}
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
                runValue={runValue}
                hourRange={hourRange}
                setRunValue={value => {
                  setHasUserFiltered(true);
                  setRunValue(value);
                }}
                setHourRange={range => {
                  setHasUserFiltered(true);
                  setHourRange(range);
                }}
                yearRange={yearRange}
                setYearRange={range => {
                  setHasUserFiltered(true);
                  setYearRange(range);
                }}
                minHour={minHour}
                maxHour={maxHour}
                minRun={minRun}
                maxRun={maxRun}
                minYear={minYear}
                maxYear={maxYear}
                onResetFilters={handleResetFilters}
                onClose={() => {}}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={value => {
                  setHasUserFiltered(true);
                  setSortBy(value);
                }}
                onOrderChange={value => {
                  setHasUserFiltered(true);
                  setSortOrder(value);
                }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {/* Mobile filters + controls */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 shadow-lg shadow-slate-900/40 backdrop-blur-xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <SearchBar
                    value={searchInput}
                    onChange={value => {
                      setHasUserFiltered(true);
                      setSearchInput(value);
                    }}
                    placeholder="Αναζήτηση οδηγού..."
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-800/70 bg-slate-950/70 px-2 py-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
                        viewMode === 'grid'
                          ? 'bg-emerald-500/20 text-emerald-100'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
                        viewMode === 'list'
                          ? 'bg-emerald-500/20 text-emerald-100'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      List
                    </button>
                    <button
                      onClick={() => setViewMode('compact')}
                      className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
                        viewMode === 'compact'
                          ? 'bg-emerald-500/20 text-emerald-100'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Compact
                    </button>
                  </div>
                  {[
                    { label: 'Εύκολες πλατίνες', value: 'easy' as const, desc: 'Γρήγορα runs' },
                    { label: 'Μέτριες πλατίνες', value: 'medium' as const, desc: 'Ισορροπημένα' },
                    { label: 'Δύσκολες πλατίνες', value: 'hard' as const, desc: 'Για πρόκληση' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setHasUserFiltered(true);
                        setDifficultyCategory(prev =>
                          prev === option.value ? null : option.value,
                        );
                      }}
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
                    runValue={runValue}
                    hourRange={hourRange}
                    setRunValue={value => {
                      setHasUserFiltered(true);
                      setRunValue(value);
                    }}
                    setHourRange={range => {
                      setHasUserFiltered(true);
                      setHourRange(range);
                    }}
                    yearRange={yearRange}
                    setYearRange={range => {
                      setHasUserFiltered(true);
                      setYearRange(range);
                    }}
                    minRun={minRun}
                    maxRun={maxRun}
                    minHour={minHour}
                    maxHour={maxHour}
                    minYear={minYear}
                    maxYear={maxYear}
                    onResetFilters={handleResetFilters}
                    onClose={() => setIsOpen(false)}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={value => {
                      setHasUserFiltered(true);
                      setSortBy(value);
                    }}
                    onOrderChange={value => {
                      setHasUserFiltered(true);
                      setSortOrder(value);
                    }}
                  />
                </div>
              </motion.div>
            </div>

            <motion.div
              key={`${sortOrder}-${sortBy}-${hourRange}-${runValue}-${yearRange}-${platformFilter}-${genreFilter}-${developerFilter}-${difficultyFilter}-${difficultyCategory}`}
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

            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    if (globalThis.window !== undefined) {
                      lastScrollYRef.current = globalThis.window.scrollY;
                    }
                    setPage(p => p + 1);
                  }}
                  disabled={isFetching}
                  className="rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/60 hover:text-white disabled:opacity-50"
                >
                  {isFetching ? 'Φόρτωση...' : 'Φόρτωσε περισσότερα'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
