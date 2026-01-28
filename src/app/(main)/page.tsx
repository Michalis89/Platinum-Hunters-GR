import HomePageClient from '@/app/components/home/HomePageClient';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Αρχική | Hobbistas',
  description:
    'Ο Hobbistas είναι η ελληνική κοινότητα για άρθρα, οδηγούς, reviews και backlog σε κάθε hobby.',
  path: '/',
});

export default function HomePage() {
  return <HomePageClient />;
}
