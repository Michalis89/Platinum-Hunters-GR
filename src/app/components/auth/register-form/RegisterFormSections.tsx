import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import FormErrorMessage from '@/app/components/ui/FormErrorMessage';
import AlertMessage from '@/app/components/ui/AlertMessage';
import CaptchaWidget from '@/app/components/auth/CaptchaWidget';
import { AuthPasswordField } from '@/app/components/auth/shared/AuthPasswordField';
import { AuthSubmitButton } from '@/app/components/auth/shared/AuthSubmitButton';
import { AuthTextField } from '@/app/components/auth/shared/AuthTextField';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';

export type PasswordStrength = {
  score: number;
  color: string;
  label: string;
  errors: string[];
};

type RegisterAlert = { type: 'success' | 'error'; message: string } | null;

type RegisterStatusAlertProps = {
  alert: RegisterAlert;
};

export function RegisterStatusAlert({ alert }: RegisterStatusAlertProps) {
  if (!alert) return null;

  return <AlertMessage type={alert.type} message={alert.message} />;
}

type RegisterIdentityFieldsProps = {
  email: string;
  username: string;
  emailError?: string;
  usernameError?: string;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
};

export function RegisterIdentityFields({
  email,
  username,
  emailError,
  usernameError,
  loading,
  onEmailChange,
  onUsernameChange,
}: RegisterIdentityFieldsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <AuthTextField
          id="email"
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={onEmailChange}
          placeholder="you@domain.com"
          error={emailError}
          disabled={loading}
        />
      </div>

      <div>
        <AuthTextField
          id="username"
          label="Username"
          type="text"
          name="username"
          value={username}
          onChange={onUsernameChange}
          placeholder="hobbyfan123"
          error={usernameError}
          disabled={loading}
        />
      </div>
    </div>
  );
}

type RegisterPasswordFieldsProps = {
  password: string;
  passwordConfirm: string;
  showPassword: boolean;
  showPasswordConfirm: boolean;
  passwordError?: string;
  passwordConfirmError?: string;
  passwordStrength: PasswordStrength | null;
  loading: boolean;
  onPasswordChange: (value: string) => void;
  onPasswordConfirmChange: (value: string) => void;
  onTogglePassword: () => void;
  onTogglePasswordConfirm: () => void;
};

export function RegisterPasswordFields({
  password,
  passwordConfirm,
  showPassword,
  showPasswordConfirm,
  passwordError,
  passwordConfirmError,
  passwordStrength,
  loading,
  onPasswordChange,
  onPasswordConfirmChange,
  onTogglePassword,
  onTogglePasswordConfirm,
}: RegisterPasswordFieldsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <AuthPasswordField
          id="password"
          name="password"
          label="Password"
          value={password}
          showPassword={showPassword}
          error={passwordError}
          disabled={loading}
          onChange={onPasswordChange}
          onToggleVisibility={onTogglePassword}
        />

        {passwordStrength ? (
          <div className="mt-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="apple-progress-track h-2 flex-1 rounded-full">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(passwordStrength.score / 4) * 100}%`,
                    backgroundColor: passwordStrength.color,
                  }}
                />
              </div>
              <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
            </div>
            {passwordStrength.errors.length > 0 ? (
              <ul className="apple-body-tracking mt-1 text-xs text-[var(--apple-secondary-label)]">
                {passwordStrength.errors.map((err, i) => (
                  <li key={i}>- {err}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      <div>
        <AuthPasswordField
          id="password-confirm"
          name="password_confirm"
          label="Confirm password"
          value={passwordConfirm}
          showPassword={showPasswordConfirm}
          error={passwordConfirmError}
          disabled={loading}
          onChange={onPasswordConfirmChange}
          onToggleVisibility={onTogglePasswordConfirm}
        />
      </div>
    </div>
  );
}

type RegisterTermsRowProps = {
  checked: boolean;
  error?: string;
  loading: boolean;
  onChange: (checked: boolean) => void;
};

export function RegisterTermsRow({ checked, error, loading, onChange }: RegisterTermsRowProps) {
  return (
    <div className="space-y-2">
      <div className="apple-auth-section flex items-start gap-2 px-4 py-3 text-sm">
        <Checkbox
          id="agree-to-terms"
          checked={checked}
          onCheckedChange={value => onChange(value === true)}
          disabled={loading}
          className="mt-0.5 h-4 w-4 rounded-[7px] border-[var(--apple-separator)] data-[state=checked]:border-[var(--apple-system-blue)] data-[state=checked]:bg-[var(--apple-system-blue)]"
        />
        <Label
          htmlFor="agree-to-terms"
          className="apple-body-tracking text-[13px] font-medium tracking-[-0.008em] text-[var(--apple-label)]"
        >
          I accept the{' '}
          <Link
            href="/pages/terms"
            className="font-semibold text-[var(--apple-system-blue)] transition hover:opacity-80"
          >
            terms of use
          </Link>{' '}
          and the{' '}
          <Link
            href="/pages/privacy"
            className="font-semibold text-[var(--apple-system-blue)] transition hover:opacity-80"
          >
            privacy policy
          </Link>
        </Label>
      </div>
      <FormErrorMessage message={error} />
    </div>
  );
}

type RegisterCaptchaSectionProps = {
  isCaptchaDisabled: boolean;
  captchaResetKey: number;
  captchaError: string | null;
  onTokenChange: (token: string | null) => void;
};

export function RegisterCaptchaSection({
  isCaptchaDisabled,
  captchaResetKey,
  captchaError,
  onTokenChange,
}: RegisterCaptchaSectionProps) {
  return (
    <div>
      {isCaptchaDisabled ? (
        <div className="apple-auth-section px-4 py-4 text-xs text-[var(--apple-secondary-label)]">
          CAPTCHA is disabled in development mode.
        </div>
      ) : (
        <CaptchaWidget
          onTokenChange={token => onTokenChange(token)}
          resetSignal={captchaResetKey}
        />
      )}

      {!isCaptchaDisabled && captchaError ? <FormErrorMessage message={captchaError} /> : null}
    </div>
  );
}

type RegisterSubmitButtonProps = {
  loading: boolean;
  isRedirecting: boolean;
  canSubmit: boolean;
};

export function RegisterSubmitButton({
  loading,
  isRedirecting,
  canSubmit,
}: RegisterSubmitButtonProps) {
  const isBusy = loading || isRedirecting;

  return (
    <AuthSubmitButton
      type="submit"
      variant="primary"
      disabled={!canSubmit}
      className="apple-auth-control flex h-11 w-full items-center justify-center gap-2 text-[0.95rem] font-semibold tracking-[-0.01em]"
      loading={isBusy}
      loadingContent={
        isRedirecting ? (
          <>
            Redirecting...
            <Spinner data-icon="inline-start" className="h-4 w-4" />
          </>
        ) : (
          <>
            Creating account...
            <Spinner data-icon="inline-start" className="h-4 w-4" />
          </>
        )
      }
      idleContent={
        <>
          <UserPlus className="h-5 w-5" />
          Complete Registration
        </>
      }
    />
  );
}

type LoginPromptProps = {
  redirectParam: string | null;
};

export function LoginPrompt({ redirectParam }: LoginPromptProps) {
  return (
    <>
      <Separator className="bg-[var(--apple-separator-soft)]" />

      <div className="apple-body-tracking text-center text-sm text-[var(--apple-secondary-label)]">
        Already have an account?{' '}
        <Link
          href={
            redirectParam
              ? `/auth/login?redirect=${encodeURIComponent(redirectParam)}`
              : '/auth/login'
          }
          className="font-semibold text-[var(--apple-system-blue)] transition hover:opacity-80"
        >
          Login
        </Link>
      </div>
    </>
  );
}

type RegisterHeaderIconProps = {
  className?: string;
};

export function RegisterHeaderIcon({ className }: RegisterHeaderIconProps) {
  return <UserPlus className={className ?? 'h-5 w-5'} />;
}
