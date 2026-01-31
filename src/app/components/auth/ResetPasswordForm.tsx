'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff } from 'lucide-react'; // Προσθήκη για καλύτερο UX
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import ErrorState from '@/app/components/ui/ErrorState';
import Feedback from '@/app/components/ui/Feedback';
import { validatePassword } from '@/utils/validation/auth';
import { supabase } from '@/lib/supabase-client';

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const ensureSession = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) {
          setError('Το session έληξε. Παρακαλούμε ζητήστε νέο σύνδεσμο ανάκτησης.');
        }
      } catch {
        // Διόρθωση: Αφαιρέσαμε το (err) γιατί δεν χρησιμοποιούνταν
        setError('Αποτυχία ελέγχου σύνδεσης.');
      } finally {
        setLoading(false);
      }
    };
    ensureSession();
  }, []);

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
      if (updateError) throw updateError;

      await supabase.auth.signOut();
      setSuccess('Ο κωδικός ενημερώθηκε! Μεταφέρεστε στη σύνδεση...');
      setTimeout(() => router.push('/pages/auth/login'), 2000);
    } catch (err) {
      // Διόρθωση: Type safety αντί για any
      const errorMessage = err instanceof Error ? err.message : 'Κάτι πήγε στραβά.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--hb-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--hb-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    // Χρήση του νέου hb-gradient για το background
    <div className="flex min-h-screen items-center justify-center bg-[var(--hb-bg)] bg-[image:var(--hb-gradient)] px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden rounded-[var(--hb-radius-lg)] border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[var(--hb-shadow-md)] backdrop-blur-md">
          <CardHeader className="pb-4 pt-8 text-center">
            <div className="bg-[var(--hb-primary)]/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-[var(--hb-primary)]">
              <Lock className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-[var(--hb-headline)]">
              Νέος Κωδικός
            </CardTitle>
            <p className="mt-2 text-sm text-[var(--hb-muted)]">
              Ορίστε τον νέο κωδικό πρόσβασης για το λογαριασμό σας.
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            {error && <ErrorState error={error} />}
            {success && <Feedback variant="success" description={success} />}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-[var(--hb-muted)] hover:text-[var(--hb-text)]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
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

              <Button
                type="submit"
                disabled={submitting}
                className="shadow-[var(--hb-primary)]/20 h-12 w-full border-none bg-[var(--hb-primary)] text-base font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.01] hover:bg-[var(--hb-primary-strong)] active:scale-[0.98]"
              >
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
