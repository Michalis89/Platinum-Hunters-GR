'use client';

import {
  LoadingState,
  ResetPasswordCard,
} from '@/app/components/auth/reset-password-form/ResetPasswordFormSections';
import { useResetPasswordForm } from '@/app/components/auth/reset-password-form/useResetPasswordForm';

type ResetPasswordFormProps = {
  allowDevPreview?: boolean;
  hasRecoveryParams?: boolean;
};

export default function ResetPasswordForm({
  allowDevPreview = false,
  hasRecoveryParams = false,
}: ResetPasswordFormProps) {
  const {
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
  } = useResetPasswordForm({ allowDevPreview, hasRecoveryParams });

  if (loading) {
    return <LoadingState />;
  }

  if (!hasValidSession) return null;

  return (
    <div className="apple-auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute -left-24 -top-20 h-64 w-64 rounded-full bg-[color-mix(in_srgb,var(--apple-system-blue)_22%,transparent)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--apple-system-green)_18%,transparent)] blur-3xl" />

      <ResetPasswordCard
        error={error}
        success={success}
        submitting={submitting}
        canSubmit={canSubmit}
        password={password}
        confirmPassword={confirmPassword}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        passwordRequirements={passwordRequirements}
        passwordsMatch={passwordsMatch}
        passedRequirementCount={passedRequirementCount}
        passwordStrengthProgress={passwordStrengthProgress}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onTogglePassword={() => setShowPassword(prev => !prev)}
        onToggleConfirmPassword={() => setShowConfirmPassword(prev => !prev)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
