'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, UserPlus, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Textarea } from '@/app/components/ui/Textarea';
import FormErrorMessage from '@/app/components/ui/FormErrorMessage';
import AlertMessage from '@/app/components/ui/AlertMessage';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validatePasswordConfirm,
  validateFullName,
  validateDateOfBirth,
  validateBio,
  getPasswordStrength,
} from '@/utils/validation/auth';
import type { RegisterData } from '@/types/auth';
import { Button } from '@/components/ui/button';
import CaptchaWidget from '@/app/components/auth/CaptchaWidget';
import { COUNTRIES } from '@/data/hobbyConstants';

const isCaptchaDisabled = process.env.NODE_ENV === 'development';

interface RegisterFormProps {
  readonly onSuccess?: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const inputClasses =
    'bg-[var(--hb-input-bg)] text-[var(--apple-label)] placeholder:text-[var(--apple-secondary-label)]';
  const selectClasses = 'bg-[var(--hb-input-bg)] text-[var(--apple-label)]';

  const [formData, setFormData] = useState<Partial<RegisterData>>({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
    agree_to_terms: false,
    full_name: '',
    date_of_birth: '',
    country: 'US',
    bio: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    const emailVal = validateEmail(formData.email || '');
    if (!emailVal.isValid) nextErrors.email = emailVal.error || 'Invalid email';

    const usernameVal = validateUsername(formData.username || '');
    if (!usernameVal.isValid) nextErrors.username = usernameVal.error || 'Invalid username';

    const passwordVal = validatePassword(formData.password || '');
    if (!passwordVal.isValid) nextErrors.password = passwordVal.error || 'Invalid password';

    const passwordConfirmVal = validatePasswordConfirm(
      formData.password || '',
      formData.password_confirm || '',
    );
    if (!passwordConfirmVal.isValid) {
      nextErrors.password_confirm = passwordConfirmVal.error || 'Passwords do not match';
    }

    const nameVal = validateFullName(formData.full_name || '');
    if (!nameVal.isValid) nextErrors.full_name = nameVal.error || 'Invalid full name';

    const dobVal = validateDateOfBirth(formData.date_of_birth || '');
    if (!dobVal.isValid) nextErrors.date_of_birth = dobVal.error || 'Invalid date of birth';

    const bioVal = validateBio(formData.bio || '');
    if (!bioVal.isValid) nextErrors.bio = bioVal.error || 'Invalid bio';

    if (!formData.country) {
      nextErrors.country = 'Country is required';
    }

    if (!formData.agree_to_terms) {
      nextErrors.agree_to_terms = 'You must accept the terms of use';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    setAlert(null);

    if (!validateForm()) return;

    if (!isCaptchaDisabled && !captchaToken) {
      setCaptchaError('Complete CAPTCHA to continue.');
      return;
    }

    setCaptchaError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          full_name: formData.full_name,
          date_of_birth: formData.date_of_birth,
          country: formData.country,
          bio: formData.bio || null,
          psn_id: null,
          favorite_platform: null,
          favorite_genres: null,
          categories: null,
          favorite_anime_genres: null,
          favorite_movie_genres: null,
          favorite_book_genres: null,
          favorite_languages: null,
          pet_types: null,
          vape_device: null,
          vape_flavor: null,
          captchaToken: isCaptchaDisabled ? 'dev-bypass' : captchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration error');
      }

      setAlert({
        type: 'success',
        message: 'We sent you a confirmation email. Check your inbox.',
      });

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          const targetUrl = redirectParam ? decodeURIComponent(redirectParam) : '/pages/auth/login';
          router.push(targetUrl);
        }
      }, 1200);
    } catch (error) {
      console.error('Registration error:', error);
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
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Registration failed. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="apple-auth-card flex h-[min(90vh,820px)] min-h-[700px] flex-col overflow-hidden">
      <CardHeader className="flex-none border-[var(--apple-separator-soft)] bg-transparent px-6 pb-5 pt-6">
        <CardTitle className="flex items-center justify-between text-[var(--apple-label)]">
          <span className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--apple-radius-control)] bg-[color-mix(in_srgb,var(--apple-system-blue)_15%,transparent)] text-[var(--apple-system-blue)]">
              <UserPlus className="h-5 w-5" />
            </div>
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-semibold">Create Account</span>
              <span className="apple-body-tracking text-xs text-[var(--apple-secondary-label)]">
                Secure signup in one step
              </span>
            </span>
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col overflow-hidden px-6 pb-0 pt-5">
        <div className="flex-1 overflow-y-auto pr-1">
          {alert && <AlertMessage type={alert.type} message={alert.message} />}

          <div className="space-y-4">
            <div>
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                error={!!errors.email}
                className={inputClasses}
                required
              />
              <FormErrorMessage message={errors.email} />
            </div>

            <div>
              <Input
                label="Username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="hobbyfan123"
                error={!!errors.username}
                className={inputClasses}
                required
              />
              <FormErrorMessage message={errors.username} />
            </div>

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                error={!!errors.password}
                className={`${inputClasses} pr-11`}
                required
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
              <FormErrorMessage message={errors.password} />

              {passwordStrength && (
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
                  {passwordStrength.errors.length > 0 && (
                    <ul className="apple-body-tracking mt-1 text-xs text-[var(--apple-secondary-label)]">
                      {passwordStrength.errors.map((err, i) => (
                        <li key={i}>- {err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <Input
                label="Confirm password"
                type={showPasswordConfirm ? 'text' : 'password'}
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                placeholder="********"
                error={!!errors.password_confirm}
                className={`${inputClasses} pr-11`}
                required
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className={`absolute right-2.5 top-[33px] z-20 h-8 w-8 rounded-[10px] border shadow-sm ${
                  showPasswordConfirm
                    ? 'border-[var(--apple-system-blue)] bg-[var(--apple-system-blue)] text-white'
                    : 'border-[var(--apple-separator)] bg-[var(--apple-surface)] text-[var(--apple-system-blue)] hover:bg-[var(--apple-tertiary-fill)]'
                }`}
                ariaLabel={showPasswordConfirm ? 'Hide password' : 'Show password'}
              >
                {showPasswordConfirm ? (
                  <EyeOff className="h-4 w-4 text-white" />
                ) : (
                  <Eye className="h-4 w-4 text-[var(--apple-system-blue)]" />
                )}
              </Button>
              <FormErrorMessage message={errors.password_confirm} />
            </div>

            <div>
              <Input
                label="Full name"
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="John Doe"
                error={!!errors.full_name}
                className={inputClasses}
                required
              />
              <FormErrorMessage message={errors.full_name} />
            </div>

            <div>
              <Input
                label="Date of Birth"
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                error={!!errors.date_of_birth}
                className={inputClasses}
                required
              />
              <FormErrorMessage message={errors.date_of_birth} />
            </div>

            <div>
              <Select
                label="Country"
                options={COUNTRIES}
                value={formData.country}
                onChange={handleSelectChange('country')}
                className={selectClasses}
              />
              <FormErrorMessage message={errors.country} />
            </div>

            <div>
              <Textarea
                label="Bio (optional)"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us a bit about yourself..."
                rows={3}
                className={`${inputClasses} min-h-[120px]`}
              />
              <div className="apple-body-tracking mt-1 text-xs text-[var(--apple-secondary-label)]">
                {formData.bio?.length || 0} / 500
              </div>
              <FormErrorMessage message={errors.bio} />
            </div>

            <div>
              <label className="apple-body-tracking mt-2 flex items-start gap-2 text-sm text-[var(--apple-label)]">
                <input
                  type="checkbox"
                  name="agree_to_terms"
                  checked={formData.agree_to_terms}
                  onChange={handleChange}
                  className="apple-auth-checkbox mt-1 h-4 w-4 rounded-[7px] border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)]"
                />
                <span>
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
                </span>
              </label>
              <FormErrorMessage message={errors.agree_to_terms} />
            </div>
          </div>
        </div>

        <div className="flex-none space-y-4 border-t border-[var(--apple-separator-soft)] bg-transparent py-4">
          <div className="flex min-h-[80px] w-full justify-center">
            {isCaptchaDisabled ? (
              <div className="apple-auth-section px-3 py-4 text-xs text-[var(--apple-secondary-label)]">
                CAPTCHA is disabled in development mode.
              </div>
            ) : (
              <>
                <CaptchaWidget
                  onTokenChange={token => {
                    setCaptchaToken(token);
                    if (token) setCaptchaError(null);
                  }}
                  resetSignal={captchaResetKey}
                />
                <FormErrorMessage message={captchaError ?? undefined} />
              </>
            )}
          </div>

          <div className="flex flex-row gap-3">
            <Button type="button" variant="secondary" onClick={() => router.back()} disabled={loading}>
              <ArrowLeft className="h-5 w-5" />
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={loading || (!isCaptchaDisabled && !captchaToken)}
              className="flex-[2] h-11 items-center justify-center gap-2"
            >
              {loading ? (
                'Creating account...'
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Complete Registration
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>

          <div className="apple-body-tracking border-t border-[var(--apple-separator-soft)] pt-4 text-center text-sm text-[var(--apple-secondary-label)]">
            Already have an account?{' '}
            <Link
              href={
                redirectParam
                  ? `/pages/auth/login?redirect=${encodeURIComponent(redirectParam)}`
                  : '/pages/auth/login'
              }
              className="font-semibold text-[var(--apple-system-blue)] transition hover:opacity-80"
            >
              Login
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
