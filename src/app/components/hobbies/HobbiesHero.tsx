import { Layers } from 'lucide-react';
import PageHero from '@/app/components/shared/PageHero';

export function HobbiesHero() {
  return (
    <PageHero
      eyebrow="The hobbies catalog"
      title={
        <>
          Explore <span className="text-primary">Hobbies</span>
        </>
      }
      subtitle="Choose the category that interests you and start organizing: library, articles, and reviews - all in one place."
      sectionClassName="pb-16 pt-12 md:pb-20 md:pt-16"
      titleClassName="mb-5 text-3xl md:text-4xl lg:text-5xl"
      subtitleClassName="mb-8 text-base md:text-lg"
      badges={
        <>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <Layers className="h-4 w-4 text-primary" />
            <span>9 categories</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Library</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            <span>Articles</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Reviews</span>
          </div>
        </>
      }
    />
  );
}
