import Link from 'next/link';
import { AlertCircle, CheckCircle2, LogIn, Mail } from 'lucide-react';
import CaptchaWidget from '@/app/components/auth/CaptchaWidget';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { AuthPasswordField } from '@/app/components/auth/shared/AuthPasswordField';
import { AuthSubmitButton } from '@/app/components/auth/shared/AuthSubmitButton';
import { AuthTextField } from '@/app/components/auth/shared/AuthTextField';
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
    <AuthTextField
      id="identifier"
      name="identifier"
      label="Email or username"
      value={identifier}
      onChange={onChange}
      placeholder="you@domain.com or username"
      error={error}
      disabled={loading || isRedirecting}
    />
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
    <AuthPasswordField
      id="password"
      name="password"
      label="Password"
      value={password}
      showPassword={showPassword}
      error={error}
      disabled={loading || isRedirecting}
      onChange={onChange}
      onToggleVisibility={onToggleVisibility}
    />
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
        <label
          htmlFor="remember"
          className="apple-body-tracking text-[13px] font-medium tracking-[-0.008em] text-[var(--apple-label)]"
        >
          Remember me
        </label>
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
  const isBusy = loading || isRedirecting;

  return (
    <AuthSubmitButton
      type="submit"
      variant="primary"
      className="apple-auth-control flex h-11 w-full items-center justify-center gap-2 text-[0.95rem] font-semibold tracking-[-0.01em]"
      disabled={!canSubmit}
      loading={isBusy}
      loadingContent={
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
      }
      idleContent={
        <>
          <LogIn className="h-5 w-5" />
          Sign in
        </>
      }
    />
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

      <AuthTextField
        id="resetEmail"
        type="email"
        name="resetEmail"
        label="Email"
        value={resetEmail}
        onChange={onResetEmailChange}
        placeholder="you@domain.com"
        disabled={resetLoading}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="primary"
          onClick={onSendRecoveryLink}
          disabled={resetLoading}
        >
          {resetLoading ? (
            <>
              Sending...
              <Spinner className="h-4 w-4" />
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
