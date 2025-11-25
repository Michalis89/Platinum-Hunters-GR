interface CheckboxProps {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function Checkbox({ label, checked, onChange }: Readonly<CheckboxProps>) {
  return (
    <label className="flex items-center space-x-2 text-white">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange?.(e.target.checked)}
        className="accent-blue-600"
      />
      <span>{label}</span>
    </label>
  );
}
