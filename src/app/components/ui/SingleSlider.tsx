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
  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="flex items-center gap-2 text-gray-300">
          {icon}
          {label}: {value}
        </span>
      )}

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-blue-500"
      />
    </div>
  );
}
