import { redirect } from 'next/navigation';
import ResetPasswordForm from '@/app/components/auth/ResetPasswordForm';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Reset Password | Hobbistas',
  description: 'Set a new password for your account securely.',
  path: '/auth/reset-password',
  noindex: true,
});

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    token_hash?: string;
    code?: string;
    type?: string;
    error?: string;
    error_description?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const allowDevPreview = process.env.NODE_ENV === 'development';

  // Get search params
  const params = await searchParams;

  // Check for error params from Supabase
  if (params?.error) {
    const errorDescription = params.error_description || 'Invalid or expired reset link';

    // Redirect to forgot password page with error
    redirect(`/auth/login?reset_error=${encodeURIComponent(errorDescription)}`);
  }

  // Validate recovery params
  const hasTokenHash = Boolean(params?.token_hash);
  const hasCode = Boolean(params?.code);
  const recoveryType = params?.type;

  // Check if this is a valid recovery request
  const hasRecoveryParams = hasTokenHash || hasCode;
  const isRecoveryType = !recoveryType || recoveryType === 'recovery';

  return (
    <ResetPasswordForm
      allowDevPreview={allowDevPreview}
      hasRecoveryParams={hasRecoveryParams && isRecoveryType}
    />
  );
}
