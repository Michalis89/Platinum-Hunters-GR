import type { FormEvent } from 'react';
import { CheckCircle2, CircleAlert, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthPasswordField } from '@/app/components/auth/shared/AuthPasswordField';
import { AuthSubmitButton } from '@/app/components/auth/shared/AuthSubmitButton';

type PasswordRequirement = {
  label: string;
  valid: boolean;
};

type StatusAlertsProps = {
  error: string | null;
  success: string | null;
};

export function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 px-6 pt-7">
          <Skeleton className="mx-auto h-12 w-12" />
          <Skeleton className="mx-auto h-6 w-52" />
          <Skeleton className="mx-auto h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-7">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-12 w-full" />
          <div className="flex justify-center pt-1">
            <Spinner className="text-info h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function StatusAlerts({ error, success }: StatusAlertsProps) {
  return (
    <>
      {error && (
        <Alert variant="destructive" className="bg-destructive/8 border-destructive/40">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>Password update failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-success/40 bg-success/10 text-foreground">
          <CheckCircle2 className="text-success h-4 w-4" />
          <AlertTitle>Password updated</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  visible: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
  infoTooltip?: string;
};

export function PasswordField({
  id,
  label,
  placeholder,
  value,
  visible,
  disabled,
  onChange,
  onToggleVisibility,
  infoTooltip,
}: PasswordFieldProps) {
  return (
    <AuthPasswordField
      id={id}
      name={id}
      label={label}
      placeholder={placeholder}
      value={value}
      showPassword={visible}
      disabled={disabled}
      onChange={onChange}
      onToggleVisibility={onToggleVisibility}
      infoTooltip={infoTooltip}
    />
  );
}

type PasswordStrengthProps = {
  requirements: PasswordRequirement[];
  passwordsMatch: boolean;
  passedRequirementCount: number;
  passwordStrengthProgress: number;
};

export function PasswordStrengthCard({
  requirements,
  passwordsMatch,
  passedRequirementCount,
  passwordStrengthProgress,
}: PasswordStrengthProps) {
  return (
    <div className="bg-card/60 rounded-xl border-border p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Password strength
        </p>
        <p className="text-xs font-medium text-foreground">
          {passedRequirementCount}/{requirements.length}
        </p>
      </div>
      <Progress value={passwordStrengthProgress} className="h-1.5" />
      <div className="mt-3 space-y-2">
        {requirements.map(requirement => (
          <div
            key={requirement.label}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <CheckCircle2
              className={`h-3.5 w-3.5 ${
                requirement.valid ? 'text-success' : 'text-muted-foreground/50'
              }`}
            />
            <span>{requirement.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2
            className={`h-3.5 w-3.5 ${
              passwordsMatch ? 'text-success' : 'text-muted-foreground/50'
            }`}
          />
          <span>Passwords match</span>
        </div>
      </div>
    </div>
  );
}

type SubmitButtonProps = {
  canSubmit: boolean;
  submitting: boolean;
};

export function SubmitButton({ canSubmit, submitting }: SubmitButtonProps) {
  return (
    <AuthSubmitButton
      variant="primary"
      size="xl"
      type="submit"
      disabled={!canSubmit}
      loading={submitting}
      loadingContent={
        <span className="flex items-center justify-center gap-2">
          Updating...
          <Spinner className="h-4 w-4 text-white" />
        </span>
      }
      idleContent="Update password"
    />
  );
}

type ResetPasswordCardProps = {
  error: string | null;
  success: string | null;
  submitting: boolean;
  canSubmit: boolean;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  passwordRequirements: PasswordRequirement[];
  passwordsMatch: boolean;
  passedRequirementCount: number;
  passwordStrengthProgress: number;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onSubmit: (e: FormEvent) => void;
};

export function ResetPasswordCard({
  error,
  success,
  submitting,
  canSubmit,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  passwordRequirements,
  passwordsMatch,
  passedRequirementCount,
  passwordStrengthProgress,
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePassword,
  onToggleConfirmPassword,
  onSubmit,
}: ResetPasswordCardProps) {
  return (
    <TooltipProvider delayDuration={120}>
      <div className="w-full max-w-md">
        <Card className="bg-card/84">
          <CardHeader className="bg-transparent pb-4 pt-7 text-center">
            <div className="bg-info/14 text-info mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <Lock className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-semibold text-foreground">
              Set New Password
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose a secure password for your account.
            </p>
          </CardHeader>

          <CardContent className="space-y-5 px-6 pb-7 pt-5">
            <StatusAlerts error={error} success={success} />

            <form onSubmit={onSubmit} className="space-y-4">
              <PasswordField
                id="new-password"
                label="New password"
                placeholder="Enter your new password"
                value={password}
                visible={showPassword}
                disabled={submitting}
                onChange={onPasswordChange}
                onToggleVisibility={onTogglePassword}
                infoTooltip="Use 8+ chars with uppercase, lowercase, number, and symbol."
              />

              <PasswordField
                id="confirm-password"
                label="Confirm password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                visible={showConfirmPassword}
                disabled={submitting}
                onChange={onConfirmPasswordChange}
                onToggleVisibility={onToggleConfirmPassword}
              />

              <Separator className="bg-border" />

              <PasswordStrengthCard
                requirements={passwordRequirements}
                passwordsMatch={passwordsMatch}
                passedRequirementCount={passedRequirementCount}
                passwordStrengthProgress={passwordStrengthProgress}
              />

              <SubmitButton canSubmit={canSubmit} submitting={submitting} />
            </form>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
