'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import FormErrorMessage from '@/app/components/ui/FormErrorMessage';
import Feedback from '@/app/components/ui/Feedback';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { validateEmail, validatePassword } from '@/utils/validation/auth';
import { fetchSession } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';
import { supabase } from '@/lib/supabase-client';
import { AlertCircle, Mail } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    remember: false,
  });

  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showResetPanel, setShowResetPanel] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetAlert, setResetAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error for this field
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleForgotPasswordClick = () => {
    setShowResetPanel(true);
    // Prefill email if the identifier looks like an email
    if (formData.identifier.includes('@')) {
      setResetEmail(formData.identifier);
    }
  };

  const handleSendResetEmail = async () => {
    setResetAlert(null);
    const emailValidation = validateEmail(resetEmail);
    if (!emailValidation.isValid) {
      setResetAlert({
        type: 'error',
        message: emailValidation.error || 'Μη έγκυρο email. Δοκίμασε ξανά.',
      });
      return;
    }

    setResetLoading(true);
    try {
      const redirectTo =
        (typeof window !== 'undefined' ? window.location.origin : '') + '/pages/auth/reset-password';
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      setResetAlert({
        type: 'success',
        message: 'Στάλθηκε email ανάκτησης. Έλεγξε τα εισερχόμενα (και τα spam).',
      });
    } catch (err) {
      console.error('Reset password error:', err);
      setResetAlert({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Δεν στάλθηκε το email. Δοκίμασε ξανά ή έλεγξε το email σου.',
      });
    } finally {
      setResetLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate identifier (email or username)
    if (!formData.identifier || formData.identifier.trim() === '') {
      newErrors.identifier = 'Το email ή το username είναι υποχρεωτικό';
    } else if (formData.identifier.includes('@')) {
      // If it contains @, validate as email
      const emailValidation = validateEmail(formData.identifier);
      if (!emailValidation.isValid) {
        newErrors.identifier = emailValidation.error;
      }
    } else if (formData.identifier.length < 3) {
      newErrors.identifier = 'Το username πρέπει να έχει τουλάχιστον 3 χαρακτήρες';
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call API route with identifier (email or username)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Σφάλμα σύνδεσης');
      }

      // Set session in client-side Supabase
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      setAlert({ type: 'success', message: '✅ Επιτυχής σύνδεση! Ανακατεύθυνση...' });

      // Fetch session to update Redux state
      await dispatch(fetchSession());

      // Redirect after short delay
      setTimeout(() => {
        router.push('/pages/guides');
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage =
        error instanceof Error ? error.message : '❌ Σφάλμα σύνδεσης. Ελέγξτε τα στοιχεία σας.';
      setAlert({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-slate-800/60 bg-slate-900/70 shadow-xl shadow-blue-900/30 backdrop-blur-xl">
      <CardHeader className="border-slate-800/70">
        <CardTitle className="flex items-center justify-between text-xl text-white">
          <span className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-sky-400 to-emerald-400 text-slate-950 shadow-lg shadow-blue-500/30">
              <LogIn className="h-5 w-5" />
            </div>
            Σύνδεση
          </span>
          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-300">
            Safe session
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {alert && (
            <Feedback
              layout="inline"
              tone={alert.type === 'success' ? 'solid' : 'soft'}
              variant={alert.type}
              title={alert.type === 'success' ? 'Επιτυχής σύνδεση' : 'Σφάλμα σύνδεσης'}
              description={alert.message}
            />
          )}

          {/* Email or Username */}
          <div>
            <Input
              label="Email ή Username"
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="player@hunters.gg ή username"
              error={!!errors.identifier}
              disabled={loading}
              required
            />
            <FormErrorMessage message={errors.identifier} />
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <Input
                label="Κωδικός"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                error={!!errors.password}
                disabled={loading}
                required
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-slate-400 transition hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <FormErrorMessage message={errors.password} />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
                className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              Να με θυμάσαι
            </label>

            <button
              type="button"
              onClick={handleForgotPasswordClick}
              className="text-emerald-400 transition hover:text-emerald-300"
            >
              Ξέχασες τον κωδικό;
            </button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-sky-500 via-blue-500 to-emerald-400 text-slate-950 shadow-lg shadow-blue-500/30 transition hover:shadow-blue-400/40"
            disabled={loading}
          >
            {loading ? (
              'Σύνδεση...'
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                <span>Σύνδεση</span>
              </>
            )}
          </Button>

          {/* Register Link */}
          <div className="pt-1 text-center text-sm text-slate-400">
            Δεν έχεις λογαριασμό;{' '}
            <Link
              href="/pages/auth/register"
              className="font-medium text-emerald-300 transition hover:text-emerald-200"
            >
              Κάνε εγγραφή
            </Link>
          </div>
        </form>

        {showResetPanel && (
          <div className="space-y-3 rounded-xl border border-slate-800/70 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Mail className="h-4 w-4 text-emerald-300" />
              Ανάκτηση κωδικού
            </div>
            <p className="text-sm text-slate-400">
              Θα σταλεί email ανάκτησης στον λογαριασμό σου. Χρησιμοποιείται το template που έχεις
              ρυθμίσει στο Supabase.
            </p>
            {resetAlert && (
              <div
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                  resetAlert.type === 'success'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-100'
                    : 'border-red-500/50 bg-red-500/10 text-red-100'
                }`}
              >
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <span>{resetAlert.message}</span>
              </div>
            )}
            <Input
              label="Email"
              type="email"
              name="resetEmail"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              placeholder="player@hunters.gg"
              disabled={resetLoading}
              required
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                onClick={handleSendResetEmail}
                disabled={resetLoading}
                className="bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-500 text-slate-950"
              >
                {resetLoading ? 'Αποστολή...' : 'Στείλε email ανάκτησης'}
              </Button>
              <button
                type="button"
                onClick={() => setShowResetPanel(false)}
                className="text-sm text-slate-400 hover:text-slate-200"
              >
                Κλείσιμο
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
