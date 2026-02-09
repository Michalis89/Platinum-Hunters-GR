import { CircleAlert, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type AuthPasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  showPassword: boolean;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
  infoTooltip?: string;
};

export function AuthPasswordField({
  id,
  name,
  label,
  value,
  showPassword,
  error,
  disabled = false,
  required = true,
  placeholder = '********',
  onChange,
  onToggleVisibility,
  infoTooltip,
}: AuthPasswordFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className="apple-body-tracking text-[13px] font-medium tracking-[-0.008em] text-[var(--apple-label)]"
        >
          {label}
        </Label>
        {infoTooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-[var(--apple-secondary-label)]"
                ariaLabel={`${label} info`}
              >
                <CircleAlert className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{infoTooltip}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          suppressHydrationWarning
          aria-invalid={!!error}
          aria-describedby={errorId}
          className="apple-auth-control h-11 border-[var(--apple-separator)] bg-[var(--hb-input-bg)] pr-12 text-[var(--apple-label)] placeholder:text-[var(--apple-secondary-label)]"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleVisibility}
              className={`absolute right-1.5 top-1/2 z-20 h-8 w-8 -translate-y-1/2 rounded-[10px] border ${
                showPassword
                  ? 'border-[var(--apple-system-blue)] bg-[var(--apple-system-blue)] text-white hover:bg-[var(--apple-system-blue)]'
                  : 'border-[var(--apple-separator)] bg-[var(--hb-card)] text-[var(--apple-label)] hover:bg-[var(--apple-tertiary-fill)]'
              }`}
              ariaLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 stroke-current text-white opacity-100" />
              ) : (
                <Eye className="h-4 w-4 stroke-current text-[var(--apple-label)] opacity-100" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{showPassword ? 'Hide password' : 'Show password'}</TooltipContent>
        </Tooltip>
      </div>
      {error ? (
        <p id={errorId} className="text-[13px] leading-relaxed text-[#ff3b30]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
