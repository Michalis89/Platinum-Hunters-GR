interface MultiSliderProps {
  readonly min: number;
  readonly max: number;
  readonly value: [number, number];
  readonly onChange: (value: [number, number]) => void;
  readonly label?: string;
  readonly icon?: React.ReactNode;
}

export default function MultiSlider({ min, max, value, onChange, label, icon }: MultiSliderProps) {
  const handleChange = (index: 0 | 1, newValue: number) => {
    const newRange: [number, number] = index === 0 ? [newValue, value[1]] : [value[0], newValue];
    onChange(newRange);
  };

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {label && (
        <span className="flex items-center gap-2 text-gray-300">
          {icon}
          {label}: {`${value[0]} - ${value[1]}`}
        </span>
      )}

      <div className="relative w-full">
        {/* First Range */}
        <input
          type="range"
          min={min}
          max={max}
          value={value[0]}
          onChange={e => handleChange(0, Number(e.target.value))}
          className="pointer-events-none absolute z-10 w-full appearance-none bg-transparent"
          style={{
            height: '6px',
            background: 'transparent',
          }}
        />

        {/* Second Range */}
        <input
          type="range"
          min={min}
          max={max}
          value={value[1]}
          onChange={e => handleChange(1, Number(e.target.value))}
          className="pointer-events-none absolute z-20 w-full appearance-none bg-transparent"
          style={{
            height: '6px',
            background: 'transparent',
          }}
        />

        {/* Μπάρα range */}
        <div
          className="absolute top-1/2 -translate-y-1/2 bg-blue-500"
          style={{
            left: `${(value[0] / max) * 100}%`,
            right: `${100 - (value[1] / max) * 100}%`,
            height: '6px',
            borderRadius: '9999px',
          }}
        />
      </div>
    </div>
  );
}
