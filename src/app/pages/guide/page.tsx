'use client';

import { useEffect, useState } from 'react';
import SearchBar from '@/app/components/guides/SearchBar';
import AlertMessage from '@/app/components/ui/AlertMessage';
import GameGrid from '@/app/components/guides/GameGrid';
import { BookOpen, ChevronDown } from 'lucide-react';
import Skeleton from '@/app/components/ui/Skeleton';
import SortFilter from '@/app/components/guides/filters/SortFilter';
import FiltersPanel from '@/app/components/guides/filters/FiltersPanel';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { useGetGamesQuery } from '@/store/api/gamesApi';
import { parseError } from '@/utils/error/parseError';
import { setProcessedGames } from '@/store/slices/processedGamesSlice';
import { resetGenre } from '@/store/slices/genresSlice';
import { resetDeveloper } from '@/store/slices/developerSlice';
import { resetDifficulty } from '@/store/slices/difficultySlice';
import { resetPlatform } from '@/store/slices/platformsSlice';

export default function Guides() {
  const dispatch = useDispatch();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [hourRange, setHourRange] = useState<[number, number]>([0, 200]);
  const [yearRange, setYearRange] = useState<[number, number]>([2000, 2025]);

  const [isOpen, setIsOpen] = useState(false);

  const { data: games, error, isLoading } = useGetGamesQuery();

  const platformFilter = useSelector((state: RootState) => state.platforms.selectedPlatform);
  const genreFilter = useSelector((state: RootState) => state.genres.selectedGenre);
  const developerFilter = useSelector((state: RootState) => state.developer.selectedDeveloper);
  const difficultyFilter = useSelector((state: RootState) => state.difficulty.selectedDifficulty);

  useEffect(() => {
    if (games) {
      dispatch(setProcessedGames(games.games));
    }
  }, [games, dispatch]);

  const filteredGames = games?.games

    ?.filter(
      game =>
        game.title.toLowerCase().includes(search.toLowerCase()) &&
        (!platformFilter || game.platform === platformFilter) &&
        (!developerFilter || game.developer === developerFilter) &&
        (!genreFilter || game.genre?.includes(genreFilter)) &&
        (difficultyFilter === null ||
          difficultyFilter === 0 ||
          (difficultyFilter !== 0 && (game.difficulty ?? 0) === difficultyFilter)) &&
        (game.hours ?? 0) >= hourRange[0] &&
        (game.hours ?? 0) <= hourRange[1] &&
        (game.release_year ?? 0) >= yearRange[0] &&
        (game.release_year ?? 0) <= yearRange[1],
    )
    ?.sort((a, b) => {
      if (sortBy === 'title') {
        return sortOrder === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }

      if (sortBy === 'difficulty') {
        return sortOrder === 'asc'
          ? (a.difficulty ?? 0) - (b.difficulty ?? 0)
          : (b.difficulty ?? 0) - (a.difficulty ?? 0);
      }

      if (sortBy === 'hours') {
        return sortOrder === 'asc'
          ? (a.hours ?? 0) - (b.hours ?? 0)
          : (b.hours ?? 0) - (a.hours ?? 0);
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

      return 0;
    });

  const handleResetFilters = () => {
    setYearRange([2000, 2025]);
    setHourRange([0, 1000]);
    setSortBy('title');
    setSortOrder('asc');
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
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white">
      <h1 className="mb-6 flex items-center gap-3 text-5xl font-extrabold text-blue-400">
        <BookOpen className="relative top-1 h-12 w-12 text-yellow-400" />
        <span>Οδηγοί</span>
      </h1>

      <SearchBar search={search} setSearch={setSearch} />

      {error && <AlertMessage type="error" message={parseError(error)} />}

      <div className="mb-4 mt-4 flex items-center justify-center gap-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
        >
          Φίλτρα
          <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <SortFilter
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={setSortBy}
          onOrderChange={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        />
      </div>

      <motion.div
        initial={{ height: 0 }}
        animate={{ height: isOpen ? 320 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 60 }}
      >
        <FiltersPanel
          isOpen={isOpen}
          hourRange={hourRange}
          setHourRange={setHourRange}
          yearRange={yearRange}
          setYearRange={setYearRange}
          onResetFilters={handleResetFilters}
        />
      </motion.div>

      <motion.div
        key={`${sortOrder}-${sortBy}-${hourRange}-${yearRange}-${platformFilter}-${genreFilter}-${developerFilter}-${difficultyFilter}`}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 40,
          duration: 0.4,
        }}
        className="mt-6 w-full max-w-6xl"
      >
        {content()}
      </motion.div>
    </div>
  );
}
