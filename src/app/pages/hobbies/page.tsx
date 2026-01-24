import HobbiesPageClient from '@/app/pages/hobbies/HobbiesPageClient';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import StructuredData from '@/utils/seo/StructuredData';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';
import { SITE_URL } from '@/config/site';

export const metadata = buildMetadata({
  title: 'Χόμπι & Κατηγορίες | Χομπίστας',
  description:
    'Ανακάλυψε όλες τις κατηγορίες του Χομπίστα: gaming, anime, manga, ταινίες, σειρές, βιβλία και πολλά ακόμη.',
  path: '/pages/hobbies',
});

export default function HobbiesPage() {
  const breadcrumb = [
    { name: 'Αρχική', url: `${SITE_URL}/` },
    { name: 'Χόμπι', url: `${SITE_URL}/pages/hobbies` },
  ];

  return (
    <>
      <StructuredData data={getBreadcrumbStructuredData(breadcrumb)} />
      <HobbiesPageClient />
    </>
  );
}
