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
}

const options = [
  { value: 'title', label: 'Αλφαβητικά', icon: <CaseSensitive /> },
  { value: 'difficulty', label: 'Δυσκολία', icon: <Target /> },
  { value: 'hours', label: 'Ώρες', icon: <Hourglass /> },
  { value: 'rating', label: 'Βαθμολογία', icon: <Star /> },
  { value: 'totalPoints', label: 'Πόντοι', icon: <Trophy /> },
  { value: 'releaseYear', label: 'Έτος Κυκλοφορίας', icon: <Calendar /> },
];

export default function SortFilter({ sortBy, sortOrder, onSortChange, onOrderChange }: Props) {
  const handleOrderChange = () => {
    onOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-4">
      <Dropdown
        options={options}
        selectedValue={sortBy}
        onSelect={value => onSortChange(value)}
        isOpen={false}
        zIndex={50}
        className="h-12 w-48"
      />
      <button
        onClick={handleOrderChange}
        className={`flex h-12 items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold text-white transition-all duration-300 ${
          sortOrder === 'asc' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'
        }`}
        aria-label={`Αλλαγή σειράς ταξινόμησης. Τρέχουσα: ${sortOrder === 'asc' ? 'Αύξουσα' : 'Φθίνουσα'}`}
      >
        <span aria-hidden="true">
          {sortOrder === 'asc' ? <ArrowUpNarrowWide /> : <ArrowDownNarrowWide />}
        </span>
        {sortOrder === 'asc' ? 'Αύξουσα' : 'Φθίνουσα'}
      </button>
    </div>
  );
}
