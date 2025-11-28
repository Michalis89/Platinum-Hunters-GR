'use client';
import { Hourglass } from 'lucide-react';
interface Props {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly min: number;
  readonly max: number;
}

export default function RunsFilter({ value, onChange, min, max }: Props) {
  return (
    <fieldset className="flex flex-col items-start gap-2 border-0 p-0">
      <legend className="flex items-center gap-2 text-sm font-medium text-slate-200">
        <Hourglass className="h-4 w-4 text-sky-300" />
        Runs: <span className="text-sky-300">{value}</span>
      </legend>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-sky-400"
        aria-label={`Μέγιστα runs: ${value}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} runs`}
      />
    </fieldset>
  );
}
