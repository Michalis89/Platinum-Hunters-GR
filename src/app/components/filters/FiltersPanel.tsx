'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import PlatformFilter from './PlatformFilter';
import GenreFilter from './GenreFilter';
import DifficultyFilter from './DifficultyFilter';
import DeveloperFilter from './DeveloperFilter';
import HourFilter from './HourFilter';
import YearFilter from './YearFilter';
import ResetFilters from './ResetFilters';
import SortFilter from './SortFilter';
import { ArrowUpNarrowWide, ArrowDownNarrowWide } from 'lucide-react';
import RunsFilter from './RunsFilter';

interface FiltersPanelProps {
  readonly hourRange: [number, number];
  readonly runRange: [number, number];
  readonly setHourRange: (value: [number, number]) => void;
  readonly setRunRange: (value: [number, number]) => void;
  readonly yearRange: [number, number];
  readonly setYearRange: (value: [number, number]) => void;
  readonly minHour: number;
  readonly maxHour: number;
  readonly minRun: number;
  readonly maxRun: number;
  readonly minYear: number;
  readonly maxYear: number;
  readonly onResetFilters: () => void;
  readonly onClose: () => void;
  readonly isOpen: boolean;
  readonly sortBy: string;
  readonly sortOrder: 'asc' | 'desc';
  readonly onSortChange: (value: string) => void;
  readonly onOrderChange: (value: 'asc' | 'desc') => void;
}

export default function FiltersPanel({
  hourRange,
  runRange,
  setHourRange,
  setRunRange,
  yearRange,
  setYearRange,
  minHour,
  maxHour,
  minRun,
  maxRun,
  minYear,
  maxYear,
  onResetFilters,
  onClose,
  isOpen,
  sortBy,
  sortOrder,
  onSortChange,
  onOrderChange,
}: FiltersPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle Escape key to close the panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <motion.section
      ref={panelRef}
      initial={{ y: -300, opacity: 0, scale: 0 }}
      animate={{ y: isOpen ? 0 : -300, opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 80 }}
      className="relative w-full rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5 shadow-xl shadow-blue-900/30 backdrop-blur-xl"
      aria-label="Φίλτρα αναζήτησης"
      tabIndex={-1}
    >
      {isOpen && (
        <div className="mt-4 flex flex-col gap-4">
          {/* Top row: platforms + genres */}
          <div className="grid grid-cols-2">
            <PlatformFilter />
            <GenreFilter />
          </div>
          {/* <div className="grid grid-cols-1">
            <GenreFilter />
          </div> */}
          {/* Developer row */}
          <div className="grid grid-cols-1">
            <DeveloperFilter />
          </div>
          {/* Sort row */}
          <div className="grid grid-cols-1">
            <SortFilter
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
              onOrderChange={onOrderChange}
              showOrderButton={false}
              className="w-full"
            />
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800/70 bg-slate-950/60 p-3">
            <DifficultyFilter />
            <RunsFilter value={runRange} onChange={setRunRange} min={minRun} max={maxRun} />
            <HourFilter value={hourRange} onChange={setHourRange} min={minHour} max={maxHour} />
            <YearFilter value={yearRange} onChange={setYearRange} min={minYear} max={maxYear} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={`flex h-12 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white transition ${
                sortOrder === 'asc'
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
              aria-label={`Αλλαγή σειράς ταξινόμησης. Τρέχουσα: ${sortOrder === 'asc' ? 'Αύξουσα' : 'Φθίνουσα'}`}
            >
              {sortOrder === 'asc' ? (
                <ArrowUpNarrowWide className="h-4 w-4" />
              ) : (
                <ArrowDownNarrowWide className="h-4 w-4" />
              )}
              {sortOrder === 'asc' ? 'Αύξουσα' : 'Φθίνουσα'}
            </button>
            <ResetFilters onReset={onResetFilters} />
          </div>
        </div>
      )}
    </motion.section>
  );
}
