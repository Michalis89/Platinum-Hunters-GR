'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
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
  readonly minHour: number;
  readonly maxHour: number;
  readonly minYear: number;
  readonly maxYear: number;
  readonly onResetFilters: () => void;
  readonly onClose: () => void;
  readonly isOpen: boolean;
}

export default function FiltersPanel({
  hourRange,
  setHourRange,
  yearRange,
  setYearRange,
  minHour,
  maxHour,
  minYear,
  maxYear,
  onResetFilters,
  onClose,
  isOpen,
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
      // Focus the panel when it opens
      panelRef.current?.focus();
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
      className="relative w-full rounded-lg bg-gray-800 p-4 shadow-md"
      aria-label="Φίλτρα αναζήτησης"
      tabIndex={-1}
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
              <HourFilter value={hourRange} onChange={setHourRange} min={minHour} max={maxHour} />
              <YearFilter value={yearRange} onChange={setYearRange} min={minYear} max={maxYear} />
              <ResetFilters onReset={onResetFilters} />
            </div>
          </div>
        </>
      )}
    </motion.section>
  );
}
