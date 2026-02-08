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
const EXPIRED_RESET_MESSAGE =
  '🔒 Το link αλλαγής κωδικού έχει λήξει ή δεν είναι έγκυρο. Ζήτησε νέο link για να συνεχίσεις με ασφάλεια.';

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) {
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
      setError(validation.error || 'Ο κωδικός δεν πληροί τις προϋποθέσεις.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Οι κωδικοί δεν ταυτίζονται.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        if (isSessionError(updateError.message)) {
          setError(EXPIRED_RESET_MESSAGE);
          router.replace(EXPIRED_REDIRECT);
          return;
        }
        throw updateError;
      }

      await supabase.auth.signOut();
      setSuccess('Ο κωδικός ενημερώθηκε! Μεταφέρεστε στη σύνδεση...');
      setTimeout(() => router.push('/pages/auth/login'), 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Κάτι πήγε στραβά.';
      if (isSessionError(errorMessage)) {
        setError(EXPIRED_RESET_MESSAGE);
        router.replace(EXPIRED_REDIRECT);
        return;
      }
      setError('Δεν καταφέραμε να ολοκληρώσουμε την αλλαγή κωδικού. Δοκιμάστε ξανά.');
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
              Νέος Κωδικός
            </CardTitle>
            <p className="apple-body-tracking mt-2 text-sm text-[var(--apple-secondary-label)]">
              Ορίστε τον νέο κωδικό πρόσβασης για το λογαριασμό σας.
            </p>
          </CardHeader>

          <CardContent className="space-y-5 px-6 pb-7 pt-5">
            {error && <ErrorState error={error} />}
            {success && (
              <Feedback variant="success" tone="soft" title="Έτοιμο" description={success} />
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  label="Νέος κωδικός"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={submitting}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-[33px] h-8 w-8 rounded-[10px]"
                  ariaLabel={showPassword ? 'Απόκρυψη κωδικού' : 'Εμφάνιση κωδικού'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>

              <Input
                label="Επιβεβαίωση κωδικού"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={submitting}
              />

              <Button variant="primary" size="xl" type="submit" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Ενημέρωση...
                  </span>
                ) : (
                  'Αλλαγή Κωδικού'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
