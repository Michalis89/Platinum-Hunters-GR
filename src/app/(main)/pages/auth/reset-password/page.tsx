import ResetPasswordForm from '@/app/components/auth/ResetPasswordForm';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Reset Password | Hobbistas',
  description: 'Set a new password for your account securely.',
  path: '/pages/auth/reset-password',
  noindex: true,
});

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
