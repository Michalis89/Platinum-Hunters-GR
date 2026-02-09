import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AuthTextFieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email';
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
};

export function AuthTextField({
  id,
  name,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  disabled = false,
  required = true,
  autoComplete,
}: AuthTextFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-2.5">
      <Label
        htmlFor={id}
        className="apple-body-tracking text-[13px] font-medium tracking-[-0.008em] text-[var(--apple-label)]"
      >
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        suppressHydrationWarning
        aria-invalid={!!error}
        aria-describedby={errorId}
        className="apple-auth-control h-11 border-[var(--apple-separator)] bg-[var(--hb-input-bg)] text-[var(--apple-label)] placeholder:text-[var(--apple-secondary-label)]"
      />
      {error ? (
        <p id={errorId} className="text-[13px] leading-relaxed text-[#ff3b30]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
