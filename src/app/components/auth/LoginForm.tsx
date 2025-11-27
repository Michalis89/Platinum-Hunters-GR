'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import FormErrorMessage from '@/app/components/ui/FormErrorMessage';
import AlertMessage from '@/app/components/ui/AlertMessage';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { validateEmail, validatePassword } from '@/utils/validation/auth';
import { fetchSession } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';
import { supabase } from '@/lib/supabase-client';

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
          {alert && <AlertMessage type={alert.type} message={alert.message} />}

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

            <Link
              href="/pages/auth/forgot-password"
              className="text-emerald-400 transition hover:text-emerald-300"
            >
              Ξέχασες τον κωδικό;
            </Link>
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
      </CardContent>
    </Card>
  );
}
