interface SelectProps {
  label?: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
}

export function Select({ label, options, value, onChange }: Readonly<SelectProps>) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-white">{label}</label>}
      <select
        value={value}
        onChange={e => onChange?.(e.target.value)}
        className="w-full rounded-lg border border-gray-700 bg-gray-900 p-2 text-white"
      >
        <option value="">-- Επιλέξτε --</option>
        {options.map(opt => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
