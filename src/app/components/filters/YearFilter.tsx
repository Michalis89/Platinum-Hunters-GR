'use client';
interface Props {
  readonly value: [number, number];
  readonly onChange: (value: [number, number]) => void;
}

export default function YearFilter({ value, onChange }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span>
        📅 Χρονολογία: {value[0]} - {value[1]}
      </span>
      <input
        type="range"
        min={2000}
        max={2025}
        value={value[0]}
        onChange={e => onChange([Number(e.target.value), value[1]])}
        className="w-full bg-blue-500"
      />
      <input
        type="range"
        min={2000}
        max={2025}
        value={value[1]}
        onChange={e => onChange([value[0], Number(e.target.value)])}
        className="w-full bg-blue-500"
      />
    </div>
  );
}
