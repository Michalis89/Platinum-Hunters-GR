'use client';
import { useState, useEffect, useRef } from 'react';
import { CalendarDays } from 'lucide-react';

const DEBOUNCE_MS = 150;

interface Props {
  readonly value: [number, number];
  readonly onChange: (value: [number, number]) => void;
  readonly min: number;
  readonly max: number;
}

export default function YearFilter({ value, onChange, min, max }: Props) {
  // Local state for instant visual feedback
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when prop changes (e.g., reset filters)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  const handleChange = (newValue: [number, number]) => {
    setLocalValue(newValue);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, DEBOUNCE_MS);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <fieldset className="flex flex-col items-start gap-2 border-0 p-0">
      <legend className="flex items-center gap-2 text-sm font-medium text-[var(--hb-text)]">
        <CalendarDays className="h-4 w-4 text-[var(--hb-primary-strong)]" />
        Χρονολογία:{' '}
        <span className="text-[var(--hb-primary-strong)]">{localValue[0]}</span> -{' '}
        <span className="text-[var(--hb-primary-strong)]">{localValue[1]}</span>
      </legend>
      <input
        type="range"
        min={min}
        max={max}
        value={localValue[0]}
        onChange={e => handleChange([Number(e.target.value), localValue[1]])}
        className="w-full accent-[var(--hb-primary-strong)]"
        aria-label={`Ελάχιστο έτος κυκλοφορίας: ${localValue[0]}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={localValue[0]}
        aria-valuetext={`${localValue[0]}`}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={localValue[1]}
        onChange={e => handleChange([localValue[0], Number(e.target.value)])}
        className="w-full accent-[var(--hb-primary-strong)]"
        aria-label={`Μέγιστο έτος κυκλοφορίας: ${localValue[1]}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={localValue[1]}
        aria-valuetext={`${localValue[1]}`}
      />
    </fieldset>
  );
}
