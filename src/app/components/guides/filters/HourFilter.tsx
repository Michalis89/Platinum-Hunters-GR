'use client';
interface Props {
  readonly value: [number, number];
  readonly onChange: (value: [number, number]) => void;
}

export default function HourFilter({ value, onChange }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span>
        ⏳ Ώρες: {value[0]} - {value[1]}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value[0]}
        onChange={e => onChange([Number(e.target.value), value[1]])}
        className="w-full bg-blue-500"
      />
      <input
        type="range"
        min={0}
        max={100}
        value={value[1]}
        onChange={e => onChange([value[0], Number(e.target.value)])}
        className="w-full bg-blue-500"
      />
    </div>
  );
}
