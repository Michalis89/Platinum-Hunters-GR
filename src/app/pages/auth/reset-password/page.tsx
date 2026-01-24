import ResetPasswordForm from '@/app/components/auth/ResetPasswordForm';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Επαναφορά Κωδικού | Χομπίστας',
  description: 'Ορισμός νέου κωδικού πρόσβασης για τον λογαριασμό σου.',
  path: '/pages/auth/reset-password',
  noindex: true,
});

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
