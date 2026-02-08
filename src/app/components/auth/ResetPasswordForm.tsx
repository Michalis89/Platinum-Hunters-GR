'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/components/ui/button';
import ErrorState from '@/app/components/ui/ErrorState';
import Feedback from '@/app/components/ui/Feedback';
import { validatePassword } from '@/utils/validation/auth';
import { supabase } from '@/lib/supabase-client';

const EXPIRED_REDIRECT = '/forgot-password?expired=true';

export default function ResetPasswordForm() {
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
  }, [router]);

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

  if (loading || !hasValidSession) {
    return (
      <div className="apple-auth-shell flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--apple-system-blue)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="apple-auth-shell flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="apple-auth-card overflow-hidden">
          <CardHeader className="border-[var(--apple-separator-soft)] bg-transparent pb-4 pt-7 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--apple-radius-control)] bg-[color-mix(in_srgb,var(--apple-system-blue)_14%,transparent)] text-[var(--apple-system-blue)]">
              <Lock className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-semibold text-[var(--apple-label)]">
              Set New Password
            </CardTitle>
            <p className="apple-body-tracking mt-2 text-sm text-[var(--apple-secondary-label)]">
              Choose a new password for your account.
            </p>
          </CardHeader>

          <CardContent className="space-y-5 px-6 pb-7 pt-5">
            {error && <ErrorState error={error} />}
            {success && (
              <Feedback variant="success" tone="soft" title="Done" description={success} />
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  label="New password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="********"
                  required
                  disabled={submitting}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-2.5 top-[33px] z-20 h-8 w-8 rounded-[10px] border shadow-sm ${
                    showPassword
                      ? 'border-[var(--apple-system-blue)] bg-[var(--apple-system-blue)] text-white'
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
              </div>

              <div className="relative">
                <Input
                  label="Confirm password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="********"
                  required
                  disabled={submitting}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-2.5 top-[33px] z-20 h-8 w-8 rounded-[10px] border shadow-sm ${
                    showConfirmPassword
                      ? 'border-[var(--apple-system-blue)] bg-[var(--apple-system-blue)] text-white'
                      : 'border-[var(--apple-separator)] bg-[var(--apple-surface)] text-[var(--apple-system-blue)] hover:bg-[var(--apple-tertiary-fill)]'
                  }`}
                  ariaLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-white" />
                  ) : (
                    <Eye className="h-4 w-4 text-[var(--apple-system-blue)]" />
                  )}
                </Button>
              </div>

              <Button variant="primary" size="xl" type="submit" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
    </div>
  );
}
