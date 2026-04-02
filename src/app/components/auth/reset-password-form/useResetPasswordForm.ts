import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { validatePassword } from '@/utils/validation/auth';
import { supabase } from '@/lib/supabase-client';
import { EXPIRED_REDIRECT, RESET_SUCCESS_REDIRECT } from './constants';
import {
  clearRecoveryParamsFromUrl,
  establishRecoverySessionFromUrl,
  hasRecoveryParamsInUrl,
} from './recoverySession';

type UseResetPasswordFormOptions = {
  allowDevPreview?: boolean;
  hasRecoveryParams?: boolean;
};

export function useResetPasswordForm({
  allowDevPreview = false,
  hasRecoveryParams = false,
}: UseResetPasswordFormOptions) {
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
  const submitInFlight = useRef(false);

  const passwordRequirements = useMemo(
    () => [
      { label: 'At least 8 characters', valid: password.length >= 8 },
      { label: 'Includes uppercase letter', valid: /[A-Z]/.test(password) },
      { label: 'Includes lowercase letter', valid: /[a-z]/.test(password) },
      { label: 'Includes number', valid: /[0-9]/.test(password) },
      {
        label: 'Includes special character',
        valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      },
    ],
    [password],
  );

  const passedRequirementCount = passwordRequirements.filter(
    requirement => requirement.valid,
  ).length;
  const passwordStrengthProgress = (passedRequirementCount / passwordRequirements.length) * 100;
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit =
    passedRequirementCount === passwordRequirements.length && passwordsMatch && !submitting;

  useEffect(() => {
    const ensureSession = async () => {
      if (allowDevPreview) {
        setHasValidSession(true);
        setLoading(false);
        return;
      }

      try {
        // Check if we have recovery params (from URL hash or query)
        const hasUrlRecoveryParams = hasRecoveryParamsInUrl();
        const shouldEstablishRecovery = hasRecoveryParams || hasUrlRecoveryParams;

        if (shouldEstablishRecovery) {
          // Clear any existing session before establishing recovery session
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

        // Check if we already have a valid session
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
  }, [allowDevPreview, hasRecoveryParams, router]);

  const handleSubmit = async (e: FormEvent) => {
    if (submitInFlight.current) {
      return;
    }
    submitInFlight.current = true;
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
      // Call the API route for password update (server-side)
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error responses
        if (response.status === 401) {
          router.replace(EXPIRED_REDIRECT);
          return;
        }
        throw new Error(data.error || 'Failed to update password');
      }

      // Success - password updated
      setSuccess('Password updated successfully. Redirecting to sign in...');
      setTimeout(() => router.push(RESET_SUCCESS_REDIRECT), 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong.';
      setError(errorMessage);
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  };

  return {
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    loading,
    hasValidSession,
    submitting,
    error,
    success,
    passwordRequirements,
    passedRequirementCount,
    passwordStrengthProgress,
    passwordsMatch,
    canSubmit,
    setPassword,
    setConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    handleSubmit,
  };
}
