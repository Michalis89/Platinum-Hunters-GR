'use client';
import { Hourglass } from 'lucide-react';
interface Props {
  readonly value: [number, number];
  readonly onChange: (value: [number, number]) => void;
  readonly min: number;
  readonly max: number;
}

export default function RunsFilter({ value, onChange, min, max }: Props) {
  return (
    <fieldset className="flex flex-col items-start gap-2 border-0 p-0">
      <legend className="flex items-center gap-2 text-sm font-medium text-slate-200">
        <Hourglass className="h-4 w-4 text-sky-300" />
        Runs: <span className="text-sky-300">{value[0]}</span> -{' '}
        <span className="text-sky-300">{value[1]}</span>
      </legend>
      <input
        type="range"
        min={min}
        max={max}
        value={value[0]}
        onChange={e => onChange([Number(e.target.value), value[1]])}
        className="w-full accent-sky-400"
        aria-label={`Ελάχιστo run: ${value[0]}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value[0]}
        aria-valuetext={`${value[0]} run`}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={value[1]}
        onChange={e => onChange([value[0], Number(e.target.value)])}
        className="w-full accent-sky-400"
        aria-label={`Μέγιστα runs: ${value[1]}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value[1]}
        aria-valuetext={`${value[1]} runs`}
      />
    </fieldset>
  );
}
