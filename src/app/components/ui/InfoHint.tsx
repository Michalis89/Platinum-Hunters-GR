'use client';

import type { ReactNode } from 'react';
import { Info } from 'lucide-react';

type InfoHintProps = {
  tip: string;
  className?: string;
  icon?: ReactNode;
};

export function InfoHint({ tip, className = '', icon }: InfoHintProps) {
  return (
    <span className={`group relative inline-flex items-center ${className}`}>
      <button
        type="button"
        aria-label="Πληροφορίες υπολογισμού"
        className="grid h-7 w-7 place-items-center rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] text-[var(--hb-primary-strong)] transition hover:border-[var(--hb-primary-strong)] hover:bg-[var(--hb-primary-strong)]/10 focus-visible:outline focus-visible:outline-[var(--hb-primary-strong)] focus-visible:outline-offset-1"
      >
        {icon ?? <Info className="h-4 w-4" />}
      </button>
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden w-[min(220px,70vw)] -translate-x-1/2 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3 text-xs text-[var(--hb-text)] shadow-[0_20px_40px_rgba(0,0,0,0.5)] opacity-0 transition duration-200 group-hover:block group-hover:opacity-100">
        {tip}
        <span
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1.5 rotate-45 rounded-sm border border-[var(--hb-border)] bg-[var(--hb-card)]"
          style={{ width: 12, height: 12 }}
        />
      </span>
    </span>
  );
}
