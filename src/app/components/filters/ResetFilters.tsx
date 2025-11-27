'use client';
interface Props {
  readonly onReset: () => void;
}

export default function ResetFilters({ onReset }: Props) {
  return (
    <button
      onClick={onReset}
      className="w-full rounded-xl border border-red-500/50 bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-600"
    >
      Reset
    </button>
  );
}
