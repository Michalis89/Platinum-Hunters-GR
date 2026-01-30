import SupportForm from '@/app/components/support/SupportForm.client';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { SITE_CONTACT_EMAIL } from '@/config/site';

export const metadata = buildMetadata({
  title: 'Υποστήριξη | Hobbistas',
  description: 'Επικοινώνησε με την ομάδα του Hobbistas για bug reports, προτάσεις ή feedback.',
  path: '/pages/support',
});

export default function SupportPage() {
  const securityEmail = process.env.SUPPORT_SECURITY_EMAIL ?? null;

  return <SupportForm securityEmail={securityEmail} contactEmail={SITE_CONTACT_EMAIL} />;
}
