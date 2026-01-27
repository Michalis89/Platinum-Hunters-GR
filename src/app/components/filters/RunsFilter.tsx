'use client';
import { useState, useEffect, useRef } from 'react';
import { Hourglass } from 'lucide-react';

const DEBOUNCE_MS = 150;

interface Props {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly min: number;
  readonly max: number;
}

export default function RunsFilter({ value, onChange, min, max }: Props) {
  // Local state for instant visual feedback
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when prop changes (e.g., reset filters)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  const handleChange = (newValue: number) => {
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
        <Hourglass className="h-4 w-4 text-[var(--hb-primary-strong)]" />
        Runs: <span className="text-[var(--hb-primary-strong)]">{localValue}</span>
      </legend>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={localValue}
        onChange={e => handleChange(Number(e.target.value))}
        className="w-full accent-[var(--hb-primary-strong)]"
        aria-label={`Μέγιστα runs: ${localValue}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={localValue}
        aria-valuetext={`${localValue} runs`}
      />
    </fieldset>
  );
}
