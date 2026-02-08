'use client';

import { LogIn } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CaptchaSection,
  IdentifierField,
  LoginStatusAlert,
  LoginSubmitButton,
  PasswordField,
  RememberForgotRow,
  ResetPanel,
  SignUpPrompt,
} from './login-form/LoginFormSections';
import { isCaptchaDisabled } from './login-form/constants';
import { useLoginForm } from './login-form/useLoginForm';

export default function LoginForm() {
  const {
    redirectParam,
    formData,
    errors,
    showPassword,
    loading,
    isRedirecting,
    alert,
    showResetPanel,
    resetEmail,
    resetLoading,
    resetAlert,
    captchaToken,
    captchaError,
    captchaResetKey,
    captchaVisible,
    setShowPassword,
    setShowResetPanel,
    setResetEmail,
    setCaptchaToken,
    setCaptchaError,
    handleIdentifierChange,
    handlePasswordChange,
    handleRememberChange,
    handleForgotPasswordClick,
    handleSendResetEmail,
    handleSubmit,
  } = useLoginForm();

  const canSubmit =
    !loading && !isRedirecting && !(!isCaptchaDisabled && captchaVisible && !captchaToken);

  return (
    <TooltipProvider delayDuration={120}>
      <Card className="apple-auth-card apple-auth-enter apple-auth-form-frame overflow-hidden border-[var(--apple-separator)] bg-[color-mix(in_srgb,var(--apple-surface)_92%,transparent)]">
        <CardHeader className="border-b border-[var(--apple-separator-soft)] bg-transparent px-6 pb-5 pt-6">
          <CardTitle className="apple-title-tracking flex items-center gap-3 text-[1.375rem] text-[var(--apple-label)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-[var(--apple-radius-control)] bg-[color-mix(in_srgb,var(--apple-system-blue)_15%,transparent)] text-[var(--apple-system-blue)]">
              <LogIn className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-semibold">Log in to Hobbistas</span>
              <span className="apple-body-tracking mt-1 text-[0.93rem] font-normal text-[var(--apple-secondary-label)]">
                Access your account
              </span>
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-6 pt-5">
          <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
            <LoginStatusAlert alert={alert} isRedirecting={isRedirecting} />

            <IdentifierField
              identifier={formData.identifier}
              error={errors.identifier}
              onChange={handleIdentifierChange}
              loading={loading}
              isRedirecting={isRedirecting}
            />

            <PasswordField
              password={formData.password}
              showPassword={showPassword}
              error={errors.password}
              onChange={handlePasswordChange}
              onToggleVisibility={() => setShowPassword(!showPassword)}
              loading={loading}
              isRedirecting={isRedirecting}
            />

            <RememberForgotRow
              remember={formData.remember}
              onRememberChange={handleRememberChange}
              onForgotPassword={handleForgotPasswordClick}
              loading={loading}
              isRedirecting={isRedirecting}
            />

            <CaptchaSection
              captchaVisible={captchaVisible}
              captchaResetKey={captchaResetKey}
              captchaError={captchaError}
              onTokenChange={token => {
                setCaptchaToken(token);
                if (token) {
                  setCaptchaError(null);
                }
              }}
            />

            <LoginSubmitButton loading={loading} isRedirecting={isRedirecting} canSubmit={canSubmit} />

            <SignUpPrompt redirectParam={redirectParam} />
          </form>

          <ResetPanel
            showResetPanel={showResetPanel}
            resetAlert={resetAlert}
            resetEmail={resetEmail}
            resetLoading={resetLoading}
            onResetEmailChange={setResetEmail}
            onSendRecoveryLink={handleSendResetEmail}
            onClose={() => setShowResetPanel(false)}
          />
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
