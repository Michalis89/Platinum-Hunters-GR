'use client';

import Dropdown from '../ui/Dropdown';
import {
  CaseSensitive,
  Target,
  Hourglass,
  Star,
  Trophy,
  Calendar,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
} from 'lucide-react';

type SortOrder = 'asc' | 'desc';

interface Props {
  readonly sortBy: string;
  readonly sortOrder: SortOrder;
  readonly onSortChange: (value: string) => void;
  readonly onOrderChange: (value: SortOrder) => void;
  readonly showOrderButton?: boolean;
  readonly className?: string;
}

const options = [
  { value: 'title', label: 'Αλφαβητικά', icon: <CaseSensitive /> },
  { value: 'difficulty', label: 'Δυσκολία', icon: <Target /> },
  { value: 'hours', label: 'Ώρες', icon: <Hourglass /> },
  { value: 'rating', label: 'Βαθμολογία', icon: <Star /> },
  { value: 'totalPoints', label: 'Πόντοι', icon: <Trophy /> },
  { value: 'releaseYear', label: 'Έτος Κυκλοφορίας', icon: <Calendar /> },
];

export default function SortFilter({
  sortBy,
  sortOrder,
  onSortChange,
  onOrderChange,
  showOrderButton = true,
  className = '',
}: Props) {
  const handleOrderChange = () => {
    onOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className={`relative flex items-center gap-4 ${className}`}>
      <Dropdown
        options={options}
        selectedValue={sortBy}
        onSelect={value => onSortChange(value)}
        isOpen={false}
        zIndex={0}
        className="relative h-12 w-full"
      />
      {showOrderButton && (
        <button
          onClick={handleOrderChange}
          className={`flex h-12 items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold transition-all duration-300 ${
            sortOrder === 'asc'
              ? 'bg-[var(--hb-primary-strong)] text-[var(--hb-bg)] hover:brightness-110'
              : 'border border-[var(--hb-primary-strong)]/60 bg-[var(--hb-card)] text-[var(--hb-primary-strong)] hover:border-[var(--hb-primary-strong)]'
          }`}
          aria-label={`Αλλαγή σειράς ταξινόμησης. Τρέχουσα: ${sortOrder === 'asc' ? 'Αύξουσα' : 'Φθίνουσα'}`}
        >
          <span aria-hidden="true">
            {sortOrder === 'asc' ? <ArrowUpNarrowWide /> : <ArrowDownNarrowWide />}
          </span>
          {sortOrder === 'asc' ? 'Αύξουσα' : 'Φθίνουσα'}
        </button>
      )}
    </div>
  );
}
