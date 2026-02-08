import Link from 'next/link';
import { AlertCircle, CheckCircle2, Eye, EyeOff, LogIn, Mail } from 'lucide-react';
import CaptchaWidget from '@/app/components/auth/CaptchaWidget';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { alertToneClass, isCaptchaDisabled } from './constants';
import type { AlertState } from './useLoginForm';

type BaseProps = {
  loading: boolean;
  isRedirecting: boolean;
};

type StatusAlertProps = {
  alert: AlertState;
  isRedirecting: boolean;
};

export function LoginStatusAlert({ alert, isRedirecting }: StatusAlertProps) {
  if (!alert) return null;

  return (
    <Alert
      className={`apple-auth-enter rounded-[var(--apple-radius-card)] ${alertToneClass(alert.type)}`}
    >
      {alert.type === 'success' ? (
        isRedirecting ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <AlertTitle>{alert.type === 'success' ? 'Signed in' : 'Sign in error'}</AlertTitle>
      <AlertDescription>{alert.message}</AlertDescription>
    </Alert>
  );
}

type IdentifierFieldProps = BaseProps & {
  identifier: string;
  error?: string;
  onChange: (value: string) => void;
};

export function IdentifierField({
  identifier,
  error,
  onChange,
  loading,
  isRedirecting,
}: IdentifierFieldProps) {
  return (
    <div className="space-y-2.5">
      <Label
        htmlFor="identifier"
        className="apple-body-tracking text-[13px] font-medium tracking-[-0.008em] text-[var(--apple-label)]"
      >
        Email or username
      </Label>
      <Input
        id="identifier"
        type="text"
        name="identifier"
        value={identifier}
        onChange={e => onChange(e.target.value)}
        placeholder="you@domain.com or username"
        disabled={loading || isRedirecting}
        required
        suppressHydrationWarning
        aria-invalid={!!error}
        aria-describedby={error ? 'identifier-error' : undefined}
        className="apple-auth-control h-11 border-[var(--apple-separator)] bg-[var(--hb-input-bg)] text-[var(--apple-label)] placeholder:text-[var(--apple-secondary-label)]"
      />
      {error && (
        <p id="identifier-error" className="text-[13px] leading-relaxed text-[#ff3b30]">
          {error}
        </p>
      )}
    </div>
  );
}

type PasswordFieldProps = BaseProps & {
  password: string;
  showPassword: boolean;
  error?: string;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
};

export function PasswordField({
  password,
  showPassword,
  error,
  onChange,
  onToggleVisibility,
  loading,
  isRedirecting,
}: PasswordFieldProps) {
  return (
    <div className="space-y-2.5">
      <Label
        htmlFor="password"
        className="apple-body-tracking text-[13px] font-medium tracking-[-0.008em] text-[var(--apple-label)]"
      >
        Password
      </Label>
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          value={password}
          onChange={e => onChange(e.target.value)}
          placeholder="********"
          disabled={loading || isRedirecting}
          required
          suppressHydrationWarning
          aria-invalid={!!error}
          aria-describedby={error ? 'password-error' : undefined}
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
                  : 'border-[var(--apple-separator)] bg-[var(--apple-surface)] text-[var(--apple-system-blue)] hover:bg-[var(--apple-tertiary-fill)]'
              }`}
              ariaLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-white" />
              ) : (
                <Eye className="h-4 w-4 text-[var(--apple-system-blue)]" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{showPassword ? 'Hide password' : 'Show password'}</TooltipContent>
        </Tooltip>
      </div>
      {error && (
        <p id="password-error" className="text-[13px] leading-relaxed text-[#ff3b30]">
          {error}
        </p>
      )}
    </div>
  );
}

type RememberRowProps = BaseProps & {
  remember: boolean;
  onRememberChange: (checked: boolean) => void;
  onForgotPassword: () => void;
};

export function RememberForgotRow({
  remember,
  onRememberChange,
  onForgotPassword,
  loading,
  isRedirecting,
}: RememberRowProps) {
  return (
    <div className="apple-auth-section flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <Checkbox
          id="remember"
          checked={remember}
          onCheckedChange={checked => onRememberChange(checked === true)}
          disabled={loading || isRedirecting}
          className="h-4 w-4 rounded-[7px] border-[var(--apple-separator)] data-[state=checked]:border-[var(--apple-system-blue)] data-[state=checked]:bg-[var(--apple-system-blue)]"
        />
        <Label
          htmlFor="remember"
          className="apple-body-tracking text-[13px] font-medium tracking-[-0.008em] text-[var(--apple-label)]"
        >
          Remember me
        </Label>
      </div>

      <Button
        type="button"
        onClick={onForgotPassword}
        variant="secondary"
        size="sm"
        className="h-9"
        disabled={loading || isRedirecting}
      >
        Forgot password?
      </Button>
    </div>
  );
}

type CaptchaSectionProps = {
  captchaVisible: boolean;
  captchaResetKey: number;
  captchaError: string | null;
  onTokenChange: (token: string | null) => void;
};

export function CaptchaSection({
  captchaVisible,
  captchaResetKey,
  captchaError,
  onTokenChange,
}: CaptchaSectionProps) {
  return (
    <div>
      {isCaptchaDisabled ? (
        <div className="apple-auth-section px-4 py-4 text-xs text-[var(--apple-secondary-label)]">
          CAPTCHA is disabled in development mode.
        </div>
      ) : captchaVisible ? (
        <CaptchaWidget
          helperText="Complete the CAPTCHA to protect your account."
          onTokenChange={token => onTokenChange(token)}
          resetSignal={captchaResetKey}
        />
      ) : (
        <div className="apple-auth-section space-y-3 px-4 py-4">
          <Skeleton className="h-4 w-40 rounded-full bg-[var(--apple-tertiary-fill)]" />
          <Skeleton className="h-10 w-full rounded-[var(--apple-radius-control)] bg-[var(--apple-tertiary-fill)]" />
        </div>
      )}

      {!isCaptchaDisabled && captchaError && (
        <p className="mt-2 text-sm text-[#ff3b30]">{captchaError}</p>
      )}
    </div>
  );
}

type SubmitButtonProps = BaseProps & {
  canSubmit: boolean;
};

export function LoginSubmitButton({ loading, isRedirecting, canSubmit }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant="primary"
      className="apple-auth-control flex h-11 w-full items-center justify-center gap-2 text-[0.95rem] font-semibold tracking-[-0.01em]"
      disabled={!canSubmit}
    >
      {loading || isRedirecting ? (
        isRedirecting ? (
          <>
            Redirecting...
            <Spinner data-icon="inline-start" className="h-4 w-4" />
          </>
        ) : (
          <>
            Signing in...
            <Spinner data-icon="inline-start" className="h-4 w-4" />
          </>
        )
      ) : (
        <>
          <LogIn className="h-5 w-5" />
          Sign in
        </>
      )}
    </Button>
  );
}

type SignUpPromptProps = {
  redirectParam: string | null;
};

export function SignUpPrompt({ redirectParam }: SignUpPromptProps) {
  return (
    <>
      <Separator className="bg-[var(--apple-separator-soft)]" />

      <div className="apple-body-tracking text-center text-sm text-[var(--apple-secondary-label)]">
        Don&apos;t have an account?{' '}
        <Link
          href={
            redirectParam
              ? `/pages/auth/register?redirect=${encodeURIComponent(redirectParam)}`
              : '/pages/auth/register'
          }
          className="font-semibold text-[var(--apple-system-blue)] transition hover:opacity-80"
        >
          Create one
        </Link>
      </div>
    </>
  );
}

type ResetPanelProps = {
  showResetPanel: boolean;
  resetAlert: AlertState;
  resetEmail: string;
  resetLoading: boolean;
  onResetEmailChange: (value: string) => void;
  onSendRecoveryLink: () => void;
  onClose: () => void;
};

export function ResetPanel({
  showResetPanel,
  resetAlert,
  resetEmail,
  resetLoading,
  onResetEmailChange,
  onSendRecoveryLink,
  onClose,
}: ResetPanelProps) {
  if (!showResetPanel) return null;

  return (
    <div className="apple-auth-enter apple-auth-section space-y-4 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--apple-label)]">
        <Mail className="h-4 w-4 text-[var(--apple-system-blue)]" />
        Password recovery
      </div>

      <p className="apple-body-tracking text-sm text-[var(--apple-secondary-label)]">
        We&apos;ll send a recovery link to this email.
      </p>

      {resetAlert && (
        <Alert
          className={`rounded-[var(--apple-radius-control)] ${alertToneClass(resetAlert.type)}`}
        >
          {resetAlert.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{resetAlert.type === 'success' ? 'Email sent' : 'Recovery error'}</AlertTitle>
          <AlertDescription>{resetAlert.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2.5">
        <Label
          htmlFor="resetEmail"
          className="apple-body-tracking text-[13px] font-medium tracking-[-0.008em] text-[var(--apple-label)]"
        >
          Email
        </Label>
        <Input
          id="resetEmail"
          type="email"
          name="resetEmail"
          value={resetEmail}
          onChange={e => onResetEmailChange(e.target.value)}
          placeholder="you@domain.com"
          disabled={resetLoading}
          required
          suppressHydrationWarning
          className="apple-auth-control h-11 border-[var(--apple-separator)] bg-[var(--hb-input-bg)] text-[var(--apple-label)] placeholder:text-[var(--apple-secondary-label)]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="primary"
          onClick={onSendRecoveryLink}
          disabled={resetLoading}
        >
          {resetLoading ? (
            <>
              <Spinner className="h-4 w-4" />
              Sending...
            </>
          ) : (
            'Send recovery link'
          )}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose} disabled={resetLoading}>
          Close
        </Button>
      </div>
    </div>
  );
}
