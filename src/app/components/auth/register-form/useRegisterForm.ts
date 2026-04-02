import { useRef, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validatePasswordConfirm,
  getPasswordStrength,
} from '@/utils/validation/auth';
import {
  LEGAL_PATHS,
  PRIVACY_POLICY_VERSION,
  TERMS_OF_USE_VERSION,
} from '@/lib/legal/policyVersions';
import { isCaptchaDisabled } from './constants';

type AlertState = { type: 'success' | 'error'; message: string } | null;

type RegisterFormState = {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  agree_to_terms: boolean;
};

const initialState: RegisterFormState = {
  email: '',
  username: '',
  password: '',
  password_confirm: '',
  agree_to_terms: false,
};

type UseRegisterFormOptions = {
  onSuccess?: () => void;
};

export function useRegisterForm({ onSuccess }: UseRegisterFormOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [captchaVisible, setCaptchaVisible] = useState(false);
  const [formData, setFormData] = useState<RegisterFormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitInFlight = useRef(false);

  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;

  const clearFieldError = (fieldName: keyof RegisterFormState) => {
    if (!errors[fieldName]) {
      return;
    }
    setErrors(prev => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const revealCaptchaIfNeeded = () => {
    if (isCaptchaDisabled || captchaVisible) {
      return;
    }
    setCaptchaVisible(true);
  };

  const handleInputChange = (fieldName: keyof RegisterFormState, value: string) => {
    revealCaptchaIfNeeded();
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    clearFieldError(fieldName);
  };

  const handleTermsChange = (checked: boolean) => {
    revealCaptchaIfNeeded();
    setFormData(prev => ({ ...prev, agree_to_terms: checked }));
    clearFieldError('agree_to_terms');
  };

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    const emailVal = validateEmail(formData.email);
    if (!emailVal.isValid) {
      nextErrors.email = emailVal.error || 'Invalid email';
    }

    const usernameVal = validateUsername(formData.username);
    if (!usernameVal.isValid) {
      nextErrors.username = usernameVal.error || 'Invalid username';
    }

    const passwordVal = validatePassword(formData.password);
    if (!passwordVal.isValid) {
      nextErrors.password = passwordVal.error || 'Invalid password';
    }

    const passwordConfirmVal = validatePasswordConfirm(
      formData.password,
      formData.password_confirm,
    );
    if (!passwordConfirmVal.isValid) {
      nextErrors.password_confirm = passwordConfirmVal.error || 'Passwords do not match';
    }

    if (!formData.agree_to_terms) {
      nextErrors.agree_to_terms = 'You must accept the terms of use';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    if (submitInFlight.current) {
      return;
    }
    submitInFlight.current = true;
    event.preventDefault();
    setAlert(null);
    setIsRedirecting(false);

    if (!validateForm()) {
      return;
    }

    if (!isCaptchaDisabled && !captchaVisible) {
      setCaptchaVisible(true);
      setCaptchaError('Load the CAPTCHA first, then try again.');
      return;
    }

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
          agree_to_terms: formData.agree_to_terms,
          acceptedPolicies: {
            termsVersion: TERMS_OF_USE_VERSION,
            privacyVersion: PRIVACY_POLICY_VERSION,
            termsPath: LEGAL_PATHS.terms,
            privacyPath: LEGAL_PATHS.privacy,
            acceptedAt: new Date().toISOString(),
          },
          full_name: null,
          date_of_birth: null,
          country: null,
          bio: null,
          psn_id: null,
          favorite_platform: null,
          favorite_genres: null,
          categories: [],
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
      setIsRedirecting(true);

      setTimeout(() => {
        if (onSuccess) {
          setIsRedirecting(false);
          onSuccess();
          return;
        }
        const targetUrl = '/auth/confirm-email?state=pending';
        router.push(targetUrl);
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
      } else {
        setAlert({
          type: 'error',
          message:
            error instanceof Error ? error.message : 'Registration failed. Please try again.',
        });
      }
    } finally {
      submitInFlight.current = false;
      setLoading(false);
    }
  };

  return {
    redirectParam,
    loading,
    isRedirecting,
    alert,
    showPassword,
    showPasswordConfirm,
    captchaToken,
    captchaError,
    captchaVisible,
    captchaResetKey,
    formData,
    errors,
    passwordStrength,
    setShowPassword,
    setShowPasswordConfirm,
    setCaptchaToken,
    setCaptchaError,
    handleInputChange,
    handleTermsChange,
    handleSubmit,
    canSubmit: !loading && !isRedirecting && (isCaptchaDisabled || Boolean(captchaToken)),
    isCaptchaDisabled,
    router,
  };
}
