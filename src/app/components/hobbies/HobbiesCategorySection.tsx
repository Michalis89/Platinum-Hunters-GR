import { ListTodo, FileText, Star } from 'lucide-react';
import { HobbiesCategoryCard } from './HobbiesCategoryCard';
import type { HobbySection } from '@/config/hobbies';
import { getCategoriesForSection } from '@/config/hobbies';

const SECTION_ICONS = {
  backlog: ListTodo,
  news: FileText,
  reviews: Star,
};

const SECTION_COLORS = {
  backlog: 'text-emerald-400',
  news: 'text-sky-400',
  reviews: 'text-amber-400',
};

type HobbiesCategorySectionProps = {
  section: HobbySection;
};

export function HobbiesCategorySection({ section }: HobbiesCategorySectionProps) {
  const categories = getCategoriesForSection(section);
  const Icon = SECTION_ICONS[section.type];
  const colorClass = SECTION_COLORS[section.type];

  return (
    <section className="px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ${colorClass}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--hb-headline)] md:text-2xl">
              {section.title}
            </h2>
            <p className="text-sm text-[var(--hb-muted)]">{section.description}</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(category => (
            <HobbiesCategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
