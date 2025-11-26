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
    <fieldset className="flex flex-col items-center gap-2 border-0 p-0">
      {label && (
        <legend className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <span aria-hidden="true">{icon}</span>
          {label}: {value}
        </legend>
      )}

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-blue-500"
        aria-label={label ? `${label}: ${value}` : `Τιμή: ${value}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value}`}
      />
    </fieldset>
  );
}
