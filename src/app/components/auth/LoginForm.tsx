'use client';

import { useEffect, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import CaptchaWidget from '@/app/components/auth/CaptchaWidget';
import { RETURN_URL_KEY } from '@/lib/hooks/useRequireAuth';

const isCaptchaDisabled = process.env.NODE_ENV === 'development';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const redirectParam = searchParams.get('redirect');
  const forgotMode = searchParams.get('forgot') === 'true';
  const expiredResetLink = searchParams.get('expired') === 'true';
  const inputClasses =
    'bg-[var(--hb-input-bg)] text-[var(--apple-label)] placeholder:text-[var(--apple-secondary-label)]';

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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [captchaVisible, setCaptchaVisible] = useState(false);

  useEffect(() => {
    if (isCaptchaDisabled) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const revealCaptcha = () => setCaptchaVisible(true);

    if (typeof requestIdleCallback !== 'undefined') {
      idleId = requestIdleCallback(revealCaptcha, { timeout: 2500 });
    } else {
      timeoutId = setTimeout(revealCaptcha, 1200);
    }

    return () => {
      if (idleId !== null && typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleForgotPasswordClick = () => {
    setShowResetPanel(true);
    setResetAlert(null);
    if (formData.identifier.includes('@')) {
      setResetEmail(formData.identifier);
    }
  };

  useEffect(() => {
    if (!forgotMode && !expiredResetLink) return;

    setShowResetPanel(true);
    if (expiredResetLink) {
      setResetAlert({
        type: 'error',
        message:
          '🔒 Το link αλλαγής κωδικού έχει λήξει ή δεν είναι έγκυρο. Ζήτησε νέο link για να συνεχίσεις με ασφάλεια.',
      });
    }
  }, [forgotMode, expiredResetLink]);

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
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Δεν στάλθηκε το email. Δοκίμασε ξανά.');
      }

      setResetAlert({
        type: 'success',
        message: 'Αν υπάρχει λογαριασμός με αυτό το email, σου στείλαμε link επαναφοράς.',
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

    if (!formData.identifier || formData.identifier.trim() === '') {
      newErrors.identifier = 'Το email ή το username είναι υποχρεωτικό';
    } else if (formData.identifier.includes('@')) {
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

    if (!isCaptchaDisabled && !captchaVisible) {
      setCaptchaVisible(true);
      setCaptchaError('Load CAPTCHA first and try again.');
      return;
    }

    if (!validateForm()) return;

    if (!isCaptchaDisabled && !captchaToken) {
      setCaptchaError('Ολοκλήρωσε το CAPTCHA για να συνεχίσεις.');
      return;
    }

    setCaptchaError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
          captchaToken: isCaptchaDisabled ? 'dev-bypass' : captchaToken,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Σφάλμα σύνδεσης');
      }
      const payload = data.data ?? data;

      if (payload.session) {
        await supabase.auth.setSession({
          access_token: payload.session.access_token,
          refresh_token: payload.session.refresh_token,
        });
      }

      setAlert({ type: 'success', message: '✅ Επιτυχής σύνδεση! Ανακατεύθυνση...' });
      await dispatch(fetchSession());

      let redirectUrl = '/dashboard';
      if (redirectParam) {
        redirectUrl = decodeURIComponent(redirectParam);
      } else {
        try {
          const savedUrl = sessionStorage.getItem(RETURN_URL_KEY);
          if (savedUrl) {
            redirectUrl = savedUrl;
            sessionStorage.removeItem(RETURN_URL_KEY);
          }
        } catch {
          // ignore storage errors
        }
      }

      setTimeout(() => {
        router.push(redirectUrl);
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error && error.message.toLowerCase().includes('captcha')) {
        setCaptchaError('CAPTCHA failed. Retry it, and refresh the page if it persists.');
        setCaptchaResetKey(prev => prev + 1);
        setCaptchaToken(null);
        setAlert({
          type: 'error',
          message:
            'CAPTCHA verification failed. Please retry. If it keeps failing, refresh and try again.',
        });
        return;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Σφάλμα σύνδεσης. Ελέγξτε τα στοιχεία σας.';
      setAlert({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="apple-auth-card overflow-hidden">
      <CardHeader className="border-[var(--apple-separator-soft)] bg-transparent px-6 pb-5 pt-6">
        <CardTitle className="flex items-center justify-between text-xl text-[var(--apple-label)]">
          <span className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[var(--apple-radius-control)] bg-[color-mix(in_srgb,var(--apple-system-blue)_15%,transparent)] text-[var(--apple-system-blue)]">
              <LogIn className="h-5 w-5" />
            </div>
            <span className="flex flex-col leading-tight">
              <span className="font-semibold">Îύνδεση στον Hobbista</span>
              <span className="apple-body-tracking mt-1 text-sm font-normal text-[var(--apple-secondary-label)]">
                Συνέχισε στον λογαριασμό σου.
              </span>
            </span>
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5 px-6 pb-6 pt-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {alert && (
            <Feedback
              layout="inline"
              tone="soft"
              variant={alert.type}
              title={alert.type === 'success' ? 'Επιτυχής σύνδεση' : 'Σφάλμα σύνδεσης'}
              description={alert.message}
            />
          )}

          <div>
            <Input
              label="Email ή όνομα χρήστη"
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="you@domain.com ή username"
              error={!!errors.identifier}
              disabled={loading}
              required
              className={inputClasses}
            />
            <FormErrorMessage message={errors.identifier} />
          </div>

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
              <Button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-[33px] h-8 w-8 rounded-[10px]"
                variant="ghost"
                tabIndex={-1}
                ariaLabel={showPassword ? 'Απόκρυψη κωδικού' : 'Εμφάνιση κωδικού'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <FormErrorMessage message={errors.password} />
          </div>

          <div className="apple-auth-section flex items-center justify-between px-4 py-3 text-sm">
            <label className="apple-body-tracking flex items-center gap-2 text-[var(--apple-label)]">
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
                className="apple-auth-checkbox h-4 w-4 rounded-[7px] border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)]"
                disabled={loading}
              />
              Να με θυμάσαι
            </label>

            <Button
              type="button"
              onClick={handleForgotPasswordClick}
              variant="secondary"
              className="h-9"
            >
              Ξέχασες τον κωδικό;
            </Button>
          </div>

          <div>
            {isCaptchaDisabled ? (
              <div className="apple-auth-section px-4 py-4 text-xs text-[var(--apple-secondary-label)]">
                CAPTCHA is disabled in development mode.
              </div>
            ) : captchaVisible ? (
              <CaptchaWidget
                helperText="Complete the CAPTCHA to protect your account."
                onTokenChange={token => {
                  setCaptchaToken(token);
                  if (token) {
                    setCaptchaError(null);
                  }
                }}
                resetSignal={captchaResetKey}
              />
            ) : (
              <div className="apple-auth-section px-4 py-4 text-xs text-[var(--apple-secondary-label)]">
                Loading CAPTCHA...
              </div>
            )}
            {!isCaptchaDisabled && <FormErrorMessage message={captchaError ?? undefined} />}
          </div>

          <Button
            type="submit"
            variant="primary"
            icon={!loading ? <LogIn className="h-5 w-5" /> : undefined}
            className="flex h-11 w-full items-center justify-center gap-2"
            disabled={loading || (!isCaptchaDisabled && captchaVisible && !captchaToken)}
          >
            {loading ? 'Σύνδεση...' : 'Σύνδεση'}
          </Button>

          <div className="apple-body-tracking border-t border-[var(--apple-separator-soft)] pt-4 text-center text-sm text-[var(--apple-secondary-label)]">
            Δεν έχεις λογαριασμό;{' '}
            <Link
              href={
                redirectParam
                  ? `/pages/auth/register?redirect=${encodeURIComponent(redirectParam)}`
                  : '/pages/auth/register'
              }
              className="font-semibold text-[var(--apple-system-blue)] transition hover:opacity-80"
            >
              Δημιούργησε έναν
            </Link>
          </div>
        </form>

        {showResetPanel && (
          <div className="apple-auth-section space-y-4 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--apple-label)]">
              <Mail className="h-4 w-4 text-[var(--apple-system-blue)]" />
              Ανάκτηση κωδικού
            </div>
            <p className="apple-body-tracking text-sm text-[var(--apple-secondary-label)]">
              Θα σταλεί email ανάκτησης στον λογαριασμό σου.
            </p>
            {resetAlert && (
              <div
                className={`flex items-start gap-2 rounded-[var(--apple-radius-control)] border px-3 py-2 text-sm ${
                  resetAlert.type === 'success'
                    ? 'border-[var(--apple-system-blue)]/35 bg-[var(--apple-system-blue)]/10 text-[var(--apple-label)]'
                    : 'border-[#ff3b30]/35 bg-[#ff3b30]/10 text-[var(--apple-label)]'
                }`}
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{resetAlert.message}</span>
              </div>
            )}
            <Input
              label="Email"
              type="email"
              name="resetEmail"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              placeholder="you@domain.com"
              disabled={resetLoading}
              required
              className={inputClasses}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="primary"
                onClick={handleSendResetEmail}
                disabled={resetLoading}
              >
                {resetLoading ? 'Αποστολή...' : 'Αποστολή νέου link'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowResetPanel(false)}>
                Κλείσιμο
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
