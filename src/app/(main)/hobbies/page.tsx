import { buildMetadata } from '@/utils/seo/metadata/helpers';
import { HobbiesHero, HobbiesCategoryCard } from '@/app/components/hobbies';
import { HOBBY_CATEGORIES } from '@/config/hobbies';

export const metadata = buildMetadata({
  title: 'Hobbies Catalog',
  description: 'Browse hobby categories across backlog tracking, articles, and reviews.',
  path: '/hobbies',
});

export default function HobbiesPage() {
  const publicCatalogCategories = HOBBY_CATEGORIES.filter(category =>
    ['games', 'anime', 'manga', 'movies', 'tv', 'books'].includes(category.slug),
  );

  return (
    <main className="pb-14 md:pb-20">
      <HobbiesHero />
      <section className="px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-screen-2xl">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground md:text-2xl">Core categories</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Each category includes direct actions for library tracking, articles, and reviews.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {publicCatalogCategories.map(category => (
              <HobbiesCategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
