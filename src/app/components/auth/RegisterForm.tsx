'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthFormContainer } from '@/app/components/auth/shared/AuthFormContainer';
import {
  LoginPrompt,
  RegisterCaptchaSection,
  RegisterHeaderIcon,
  RegisterIdentityFields,
  RegisterPasswordFields,
  RegisterStatusAlert,
  RegisterSubmitButton,
  RegisterTermsRow,
} from './register-form/RegisterFormSections';
import { useRegisterForm } from './register-form/useRegisterForm';

interface RegisterFormProps {
  readonly onSuccess?: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const {
    redirectParam,
    loading,
    isRedirecting,
    alert,
    showPassword,
    showPasswordConfirm,
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
    canSubmit,
    isCaptchaDisabled,
  } = useRegisterForm({ onSuccess });

  return (
    <TooltipProvider delayDuration={120}>
      <AuthFormContainer
        icon={<RegisterHeaderIcon />}
        title="Create Account"
        subtitle="Start with the essentials"
      >
        <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
          <RegisterStatusAlert alert={alert} />

          <RegisterIdentityFields
            email={formData.email}
            username={formData.username}
            emailError={errors.email}
            usernameError={errors.username}
            loading={loading}
            onEmailChange={value => handleInputChange('email', value)}
            onUsernameChange={value => handleInputChange('username', value)}
          />

          <RegisterPasswordFields
            password={formData.password}
            passwordConfirm={formData.password_confirm}
            showPassword={showPassword}
            showPasswordConfirm={showPasswordConfirm}
            passwordError={errors.password}
            passwordConfirmError={errors.password_confirm}
            passwordStrength={passwordStrength}
            loading={loading}
            onPasswordChange={value => handleInputChange('password', value)}
            onPasswordConfirmChange={value => handleInputChange('password_confirm', value)}
            onTogglePassword={() => setShowPassword(prev => !prev)}
            onTogglePasswordConfirm={() => setShowPasswordConfirm(prev => !prev)}
          />

          <RegisterTermsRow
            checked={formData.agree_to_terms}
            error={errors.agree_to_terms}
            loading={loading}
            onChange={handleTermsChange}
          />

          <RegisterCaptchaSection
            isCaptchaDisabled={isCaptchaDisabled}
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

          <RegisterSubmitButton
            loading={loading}
            isRedirecting={isRedirecting}
            canSubmit={canSubmit}
          />

          <LoginPrompt redirectParam={redirectParam} />
        </form>
      </AuthFormContainer>
    </TooltipProvider>
  );
}
