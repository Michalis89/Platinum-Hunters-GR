'use client';
interface Props {
  readonly onReset: () => void;
}

export default function ResetFilters({ onReset }: Props) {
  return (
    <button
      onClick={onReset}
      className="w-full rounded-xl border border-[var(--hb-primary-strong)]/60 bg-[var(--hb-primary-strong)] px-4 py-3 text-sm font-semibold text-[var(--hb-bg)] shadow-lg shadow-black/30 transition hover:brightness-110"
    >
      Reset
    </button>
  );
}
