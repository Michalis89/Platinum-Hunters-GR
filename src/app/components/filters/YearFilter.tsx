'use client';
interface Props {
  readonly value: [number, number];
  readonly onChange: (value: [number, number]) => void;
  readonly min: number;
  readonly max: number;
}

export default function YearFilter({ value, onChange, min, max }: Props) {
  return (
    <fieldset className="flex flex-col items-center gap-2 border-0 p-0">
      <legend className="text-sm font-medium">
        📅 Χρονολογία: {value[0]} - {value[1]}
      </legend>
      <input
        type="range"
        min={min}
        max={max}
        value={value[0]}
        onChange={e => onChange([Number(e.target.value), value[1]])}
        className="w-full bg-blue-500"
        aria-label={`Ελάχιστο έτος κυκλοφορίας: ${value[0]}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value[0]}
        aria-valuetext={`${value[0]}`}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={value[1]}
        onChange={e => onChange([value[0], Number(e.target.value)])}
        className="w-full bg-blue-500"
        aria-label={`Μέγιστο έτος κυκλοφορίας: ${value[1]}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value[1]}
        aria-valuetext={`${value[1]}`}
      />
    </fieldset>
  );
}
