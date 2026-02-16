import SupportForm from '@/app/components/support/SupportForm.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { SITE_CONTACT_EMAIL } from '@/config/site';
import { requireServerAuth } from '@/lib/auth/requireServerAuth';

export const metadata = buildMetadata({
  title: 'Support | Hobbistas',
  description: 'Contact the Hobbistas team for bug reports, feedback, or author rights requests.',
  path: '/support',
});

export default async function SupportPage() {
  await requireServerAuth('/support');
  const securityEmail = process.env.SUPPORT_SECURITY_EMAIL ?? null;

  return <SupportForm securityEmail={securityEmail} contactEmail={SITE_CONTACT_EMAIL} />;
}
