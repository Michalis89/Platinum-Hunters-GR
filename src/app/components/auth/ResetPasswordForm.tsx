'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import Feedback from '@/app/components/ui/Feedback';
import { validatePassword } from '@/utils/validation/auth';
import { supabase } from '@/lib/supabase-client';

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Ensure the recovery link created a session; otherwise, guide user back to login
  useEffect(() => {
    const ensureSession = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) {
          setError(
            'Δεν βρέθηκε ενεργό session από το link επαναφοράς. Ξανακάνε αίτημα ανάκτησης από το login.',
          );
        }
      } catch (err) {
        console.error('Session check error:', err);
        setError('Αποτυχία ελέγχου session. Προσπάθησε ξανά.');
      } finally {
        setLoading(false);
      }
    };

    ensureSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }
    if (password !== confirmPassword) {
      setError('Οι κωδικοί δεν ταιριάζουν.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setSuccess('Ο κωδικός άλλαξε επιτυχώς! Θα σε συνδέσουμε ξανά...');
      setTimeout(() => {
        router.push('/pages/auth/login');
      }, 1200);
    } catch (err) {
      console.error('Reset password update error:', err);
      setError(
        err instanceof Error ? err.message : 'Δεν έγινε η αλλαγή κωδικού. Προσπάθησε ξανά.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        Έλεγχος συνδέσμου...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-16 text-slate-100">
      <div className="mx-auto max-w-md">
        <Card className="border border-slate-800/70 bg-slate-900/70 shadow-xl shadow-blue-900/30 backdrop-blur-xl">
          <CardHeader className="border-slate-800/70">
            <CardTitle className="flex items-center gap-2 text-xl text-white">
              <Lock className="h-5 w-5 text-emerald-300" />
              Ορισμός νέου κωδικού
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-300">
              Εισάγετε τον νέο κωδικό σας. Το αίτημα θα χρησιμοποιήσει το session που δημιουργήθηκε
              από το email ανάκτησης.
            </p>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <Feedback
                layout="inline"
                tone="solid"
                variant="success"
                title="Επιτυχής αλλαγή"
                description={success}
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                label="Νέος κωδικός"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={submitting}
              />
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
                className="w-full bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-500 text-slate-950 shadow-lg shadow-emerald-500/20"
              >
                {submitting ? 'Αποθήκευση...' : 'Αποθήκευση νέου κωδικού'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
