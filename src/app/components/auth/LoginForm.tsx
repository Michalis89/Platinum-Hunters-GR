'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, LogIn, AlertCircle, Mail } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/app/components/ui/Input';
import FormErrorMessage from '@/app/components/ui/FormErrorMessage';
import Feedback from '@/app/components/ui/Feedback';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { validateEmail, validatePassword } from '@/utils/validation/auth';
import { fetchSession } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';
import { supabase } from '@/lib/supabase-client';
import Button from '../ui/Button';

const RETURN_URL_KEY = 'platinum-hunters-return-url';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  // Get redirect URL from query param (priority) or sessionStorage (fallback)
  const redirectParam = searchParams.get('redirect');

  const inputClasses =
    'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-headline)] placeholder:text-[var(--hb-muted)] focus:border-[var(--hb-primary-strong)] focus:ring-[var(--hb-primary-strong)]';

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
  const [resetAlert, setResetAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

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
        (typeof window !== 'undefined' ? window.location.origin : '') +
        '/pages/auth/reset-password';
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
      const payload = data.data ?? data;

      // Set session in client-side Supabase
      if (payload.session) {
        await supabase.auth.setSession({
          access_token: payload.session.access_token,
          refresh_token: payload.session.refresh_token,
        });
      }

      setAlert({ type: 'success', message: '✅ Επιτυχής σύνδεση! Ανακατεύθυνση...' });

      // Fetch session to update Redux state
      await dispatch(fetchSession());

      // Get return URL: query param (priority) > sessionStorage (fallback) > home
      let redirectUrl = '/';
      if (redirectParam) {
        redirectUrl = decodeURIComponent(redirectParam);
      } else {
        try {
          const savedUrl = sessionStorage.getItem(RETURN_URL_KEY);
          if (savedUrl) {
            redirectUrl = savedUrl;
            sessionStorage.removeItem(RETURN_URL_KEY); // Clean up
          }
        } catch {
          // ignore storage errors
        }
      }

      // Redirect after short delay
      setTimeout(() => {
        router.push(redirectUrl);
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
    <Card className="border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[var(--hb-shadow-md)] backdrop-blur">
      <CardHeader className="border-[var(--hb-border)]">
        <CardTitle className="flex items-center justify-between text-xl text-[var(--hb-headline)]">
          <span className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] text-white shadow-[var(--hb-shadow-md)]">
              <LogIn className="h-5 w-5" />
            </div>
            <span className="flex flex-col leading-tight">
              <span className="font-semibold">Σύνδεση στον Χομπίστα</span>
            </span>
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
              label="Email ή όνομα χρήστη"
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="you@hobistas.app ή username"
              error={!!errors.identifier}
              disabled={loading}
              required
              className={inputClasses}
            />
            <FormErrorMessage message={errors.identifier} />
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <Input
                label="Κωδικός πρόσβασης"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                error={!!errors.password}
                disabled={loading}
                required
                className={`${inputClasses} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-[var(--hb-muted)] transition hover:text-[var(--hb-headline)]"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <FormErrorMessage message={errors.password} />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-[var(--hb-headline)]">
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
                className="rounded border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-primary-strong)] focus:ring-2 focus:ring-[var(--hb-primary-strong)]"
                disabled={loading}
              />
              Να με θυμάσαι
            </label>

            <button
              type="button"
              onClick={handleForgotPasswordClick}
              className="text-[var(--hb-primary)] transition hover:text-[var(--hb-accent)]"
            >
              Ξέχασες τον κωδικό;
            </button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            icon={!loading ? <LogIn className="h-5 w-5" /> : undefined}
            className="flex w-full items-center justify-center gap-2 bg-[var(--hb-primary-strong)] text-white shadow-[var(--hb-shadow-md)] transition hover:shadow-[var(--hb-shadow-md-hover)]"
            disabled={loading}
          >
            {loading ? 'Σύνδεση...' : 'Σύνδεση'}
          </Button>

          {/* Register Link */}
          <div className="pt-1 text-center text-sm text-[var(--hb-muted)]">
            Δεν έχεις λογαριασμό;{' '}
            <Link
              href={
                redirectParam
                  ? `/pages/auth/register?redirect=${encodeURIComponent(redirectParam)}`
                  : '/pages/auth/register'
              }
              className="font-semibold text-[var(--hb-primary)] transition hover:text-[var(--hb-accent)]"
            >
              Δημιούργησε έναν
            </Link>
          </div>
        </form>

        {showResetPanel && (
          <div className="bg-[var(--hb-card)]/80 space-y-3 rounded-xl border border-[var(--hb-border)] p-4 shadow-[var(--hb-shadow-md)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--hb-headline)]">
              <Mail className="h-4 w-4 text-[var(--hb-primary)]" />
              Ανάκτηση κωδικού
            </div>
            <p className="text-sm text-[var(--hb-muted)]">
              Θα σταλεί email ανάκτησης στον λογαριασμό σου. Χρησιμοποιείται το template που έχεις
              ρυθμίσει στο Supabase.
            </p>
            {resetAlert && (
              <div
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                  resetAlert.type === 'success'
                    ? 'border-[var(--hb-primary)]/60 bg-[var(--hb-primary)]/10 text-[var(--hb-headline)]'
                    : 'border-red-500/60 bg-red-500/10 text-red-100'
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
              placeholder="you@hobistas.app"
              disabled={resetLoading}
              required
              className={inputClasses}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                onClick={handleSendResetEmail}
                disabled={resetLoading}
                className="bg-[var(--hb-primary-strong)] text-white shadow-[var(--hb-shadow-md)]"
              >
                {resetLoading ? 'Αποστολή...' : 'Στείλε email ανάκτησης'}
              </Button>
              <button
                type="button"
                onClick={() => setShowResetPanel(false)}
                className="text-sm text-[var(--hb-muted)] hover:text-[var(--hb-headline)]"
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
