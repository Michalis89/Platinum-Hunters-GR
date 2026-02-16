import SupportForm from '@/app/components/support/SupportForm.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { SITE_CONTACT_EMAIL } from '@/config/site';
import { requireServerAuth } from '@/lib/auth/requireServerAuth';

export const metadata = buildMetadata({
  title: 'Support | Hobbistas',
  description: 'Contact support for account, content, or platform issues.',
  path: '/support',
  noindex: true,
});

export default async function SupportPage() {
  await requireServerAuth('/support');
  const securityEmail = process.env.SUPPORT_SECURITY_EMAIL ?? null;

  return <SupportForm securityEmail={securityEmail} contactEmail={SITE_CONTACT_EMAIL} />;
}
