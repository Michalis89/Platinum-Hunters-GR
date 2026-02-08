'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleAlert, Eye, EyeOff, CheckCircle2, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { validatePassword } from '@/utils/validation/auth';
import { supabase } from '@/lib/supabase-client';

const EXPIRED_REDIRECT = '/forgot-password?expired=true';

type ResetPasswordFormProps = {
  allowDevPreview?: boolean;
};

export default function ResetPasswordForm({ allowDevPreview = false }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const passwordRequirements = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'Includes uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'Includes lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'Includes number', valid: /[0-9]/.test(password) },
    {
      label: 'Includes special character',
      valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    },
  ];

  const passedRequirementCount = passwordRequirements.filter(requirement => requirement.valid).length;
  const passwordStrengthProgress = (passedRequirementCount / passwordRequirements.length) * 100;
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = passedRequirementCount === passwordRequirements.length && passwordsMatch && !submitting;

  const establishRecoverySessionFromUrl = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    // Support hash-based links: #access_token=...&refresh_token=...&type=recovery
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    const hashParams = new URLSearchParams(hash);
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const hashType = hashParams.get('type');
    if (accessToken && refreshToken && (!hashType || hashType === 'recovery')) {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (!setSessionError) return true;
    }

    // Support query-code links: ?code=...
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get('code');
    if (code) {
      const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!codeError) return true;
    }

    // Support token-hash links: ?token_hash=...&type=recovery
    const tokenHash = queryParams.get('token_hash');
    const type = queryParams.get('type');
    if (tokenHash && (!type || type === 'recovery')) {
      const { error: otpError } = await supabase.auth.verifyOtp({
        type: 'recovery',
        token_hash: tokenHash,
      });
      if (!otpError) return true;
    }

    return false;
  };

  const hasRecoveryParamsInUrl = () => {
    if (typeof window === 'undefined') return false;

    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    const hashParams = new URLSearchParams(hash);
    const hasHashTokens = !!(hashParams.get('access_token') && hashParams.get('refresh_token'));
    const hashType = hashParams.get('type');

    const queryParams = new URLSearchParams(window.location.search);
    const hasCode = !!queryParams.get('code');
    const hasTokenHash = !!queryParams.get('token_hash');
    const queryType = queryParams.get('type');

    const isRecoveryHash = hasHashTokens && (!hashType || hashType === 'recovery');
    const isRecoveryQuery = hasCode || (hasTokenHash && (!queryType || queryType === 'recovery'));

    return isRecoveryHash || isRecoveryQuery;
  };

  const clearRecoveryParamsFromUrl = () => {
    if (typeof window === 'undefined') return;
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const isSessionError = (message: string) => {
    const normalized = message.toLowerCase();
    return (
      normalized.includes('auth session missing') ||
      normalized.includes('invalid session') ||
      normalized.includes('jwt') ||
      normalized.includes('session expired')
    );
  };

  useEffect(() => {
    const ensureSession = async () => {
      if (allowDevPreview) {
        setHasValidSession(true);
        setLoading(false);
        return;
      }

      try {
        const hasRecoveryParams = hasRecoveryParamsInUrl();

        if (hasRecoveryParams) {
          // Recovery links must take precedence over any persisted local session.
          await supabase.auth.signOut({ scope: 'local' });

          const recovered = await establishRecoverySessionFromUrl();
          if (!recovered) {
            router.replace(EXPIRED_REDIRECT);
            return;
          }

          const { data: recoveredSessionData, error: recoveredSessionError } =
            await supabase.auth.getSession();
          if (recoveredSessionError || !recoveredSessionData.session) {
            router.replace(EXPIRED_REDIRECT);
            return;
          }

          clearRecoveryParamsFromUrl();
          setHasValidSession(true);
          return;
        }

        const { data, error: initialSessionError } = await supabase.auth.getSession();
        if (initialSessionError || !data.session) {
          router.replace(EXPIRED_REDIRECT);
          return;
        }

        setHasValidSession(true);
      } catch {
        router.replace(EXPIRED_REDIRECT);
        return;
      } finally {
        setLoading(false);
      }
    };

    ensureSession();
  }, [allowDevPreview, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError(validation.error || 'Password does not meet the requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        if (isSessionError(updateError.message)) {
          router.replace(EXPIRED_REDIRECT);
          return;
        }
        throw updateError;
      }

      await supabase.auth.signOut();
      setSuccess('Password updated successfully. Redirecting to sign in...');
      setTimeout(() => router.push('/pages/auth/login'), 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong.';
      if (isSessionError(errorMessage)) {
        router.replace(EXPIRED_REDIRECT);
        return;
      }
      setError('We could not complete the password update. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="apple-auth-shell flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="apple-auth-card w-full max-w-md">
          <CardHeader className="space-y-3 px-6 pt-7">
            <Skeleton className="mx-auto h-12 w-12 rounded-[var(--apple-radius-control)]" />
            <Skeleton className="mx-auto h-6 w-52" />
            <Skeleton className="mx-auto h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-7">
            <Skeleton className="h-10 w-full rounded-[var(--apple-radius-control)]" />
            <Skeleton className="h-10 w-full rounded-[var(--apple-radius-control)]" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-[var(--apple-radius-control)]" />
            <div className="flex justify-center pt-1">
              <Spinner className="h-5 w-5 text-[var(--apple-system-blue)]" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasValidSession) return null;

  return (
    <div className="apple-auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute -left-24 -top-20 h-64 w-64 rounded-full bg-[color-mix(in_srgb,var(--apple-system-blue)_22%,transparent)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--apple-system-green)_18%,transparent)] blur-3xl" />

      <TooltipProvider delayDuration={120}>
        <div className="w-full max-w-md">
          <Card className="apple-auth-card overflow-hidden border-[var(--apple-separator-soft)] bg-[color-mix(in_srgb,var(--apple-surface)_84%,transparent)] backdrop-blur-xl">
            <CardHeader className="bg-transparent pb-4 pt-7 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--apple-radius-control)] bg-[color-mix(in_srgb,var(--apple-system-blue)_14%,transparent)] text-[var(--apple-system-blue)]">
                <Lock className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-semibold text-[var(--apple-label)]">
                Set New Password
              </CardTitle>
              <p className="apple-body-tracking mt-2 text-sm text-[var(--apple-secondary-label)]">
                Choose a secure password for your account.
              </p>
            </CardHeader>

            <CardContent className="space-y-5 px-6 pb-7 pt-5">
              {error && (
                <Alert variant="destructive" className="border-[#ff3b30]/40 bg-[#ff3b30]/8">
                  <CircleAlert className="h-4 w-4" />
                  <AlertTitle>Password update failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="border-[#34c759]/40 bg-[#34c759]/10 text-[var(--apple-label)]">
                  <CheckCircle2 className="h-4 w-4 text-[#34c759]" />
                  <AlertTitle>Password updated</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <div className="mb-2 flex items-center justify-between">
                    <Label
                      htmlFor="new-password"
                      className="apple-body-tracking text-sm text-[var(--apple-label)]"
                    >
                      New password
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full text-[var(--apple-secondary-label)]"
                          ariaLabel="Password requirements info"
                        >
                          <CircleAlert className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Use 8+ chars with uppercase, lowercase, number, and symbol.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your new password"
                    required
                    disabled={submitting}
                    className="h-11 pr-11"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1.5 top-[31px] h-8 w-8 rounded-[10px] text-[var(--apple-secondary-label)] hover:text-[var(--apple-label)]"
                    ariaLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="relative">
                  <Label
                    htmlFor="confirm-password"
                    className="apple-body-tracking mb-2 block text-sm text-[var(--apple-label)]"
                  >
                    Confirm password
                  </Label>
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    disabled={submitting}
                    className="h-11 pr-11"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-1.5 top-[31px] h-8 w-8 rounded-[10px] text-[var(--apple-secondary-label)] hover:text-[var(--apple-label)]"
                    ariaLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <Separator className="bg-[var(--apple-separator-soft)]" />

                <div className="rounded-xl border border-[var(--apple-separator-soft)] bg-[var(--apple-surface)]/60 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium tracking-wide text-[var(--apple-secondary-label)] uppercase">
                      Password strength
                    </p>
                    <p className="text-xs font-medium text-[var(--apple-label)]">
                      {passedRequirementCount}/{passwordRequirements.length}
                    </p>
                  </div>
                  <Progress value={passwordStrengthProgress} className="h-1.5" />
                  <div className="mt-3 space-y-2">
                    {passwordRequirements.map(requirement => (
                      <div
                        key={requirement.label}
                        className="flex items-center gap-2 text-xs text-[var(--apple-secondary-label)]"
                      >
                        <CheckCircle2
                          className={`h-3.5 w-3.5 ${
                            requirement.valid
                              ? 'text-[#34c759]'
                              : 'text-[var(--apple-tertiary-label)]'
                          }`}
                        />
                        <span>{requirement.label}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-xs text-[var(--apple-secondary-label)]">
                      <CheckCircle2
                        className={`h-3.5 w-3.5 ${
                          passwordsMatch ? 'text-[#34c759]' : 'text-[var(--apple-tertiary-label)]'
                        }`}
                      />
                      <span>Passwords match</span>
                    </div>
                  </div>
                </div>

                <Button variant="primary" size="xl" type="submit" disabled={!canSubmit}>
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner className="h-4 w-4 text-white" />
                      Updating...
                    </span>
                  ) : (
                    'Update password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    </div>
  );
}
