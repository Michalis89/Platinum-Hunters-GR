'use client';
interface Props {
  readonly onReset: () => void;
}

export default function ResetFilters({ onReset }: Props) {
  return (
    <button
      onClick={onReset}
      className="w-full rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition-all duration-300 hover:bg-red-600"
    >
      ❌ Reset Φίλτρων
    </button>
  );
}
