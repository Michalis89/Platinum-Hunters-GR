'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import PlatformFilter from './PlatformFilter';
import GenreFilter from './GenreFilter';
import DifficultyFilter from './DifficultyFilter';
import DeveloperFilter from './DeveloperFilter';
import HourFilter from './HourFilter';
import YearFilter from './YearFilter';
import ResetFilters from './ResetFilters';

interface FiltersPanelProps {
  readonly hourRange: [number, number];
  readonly setHourRange: (value: [number, number]) => void;
  readonly yearRange: [number, number];
  readonly setYearRange: (value: [number, number]) => void;
  readonly onResetFilters: () => void;
  readonly onClose: () => void;
  readonly isOpen: boolean;
}

export default function FiltersPanel({
  hourRange,
  setHourRange,
  yearRange,
  setYearRange,
  onResetFilters,
  onClose,
  isOpen,
}: FiltersPanelProps) {
  return (
    <motion.div
      initial={{ y: -300, opacity: 0, scale: 0 }}
      animate={{ y: isOpen ? 0 : -300, opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 80 }}
      className="relative w-full rounded-lg bg-gray-800 p-4 shadow-md"
    >
      {isOpen && (
        <>
          <button
            onClick={onClose}
            className="absolute right-2 top-2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
            aria-label="Κλείσιμο φίλτρων"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mt-4 grid w-full max-w-xl grid-cols-2 gap-4">
            <div className="space-y-4">
              <PlatformFilter />
              <GenreFilter />
              <DeveloperFilter />
            </div>

            <div className="space-y-4">
              <DifficultyFilter />
              <HourFilter value={hourRange} onChange={setHourRange} />
              <YearFilter value={yearRange} onChange={setYearRange} />
              <ResetFilters onReset={onResetFilters} />
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
