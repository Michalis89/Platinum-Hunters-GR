'use client';
import { useState, useEffect, useRef } from 'react';

const DEBOUNCE_MS = 150;

interface SingleSliderProps {
  readonly min: number;
  readonly max: number;
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly label?: string;
  readonly icon?: React.ReactNode;
}

export default function SingleSlider({
  min,
  max,
  value,
  onChange,
  label,
  icon,
}: SingleSliderProps) {
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
      {label && (
        <legend className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <span aria-hidden="true">{icon}</span>
          {label}: {localValue}
        </legend>
      )}

      <input
        type="range"
        min={min}
        max={max}
        value={localValue}
        onChange={e => handleChange(Number(e.target.value))}
        className="w-full accent-sky-400"
        aria-label={label ? `${label}: ${localValue}` : `Τιμή: ${localValue}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={localValue}
        aria-valuetext={`${localValue}`}
      />
    </fieldset>
  );
}
