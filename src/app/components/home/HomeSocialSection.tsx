'use client';

import { Separator } from '@/components/ui/separator';
import { HomeRecentActivity } from './HomeRecentActivity';
import { HomeSuggestions, type HomeSuggestionItem } from './HomeSuggestions';

const SECTION_SPACING = 'pt-10 md:pt-12';
const DIVIDER_WRAP = 'mx-auto mt-8 max-w-screen-2xl px-4 md:mt-10 md:px-6';
const DIVIDER_STYLE = '';

type HomeSocialSectionProps = {
  enabledCategories: string[];
  showSuggestions: boolean;
  showActivity: boolean;
  suggestionFallbackByCategory?: Record<string, HomeSuggestionItem[]>;
};

export function HomeSocialSection({
  enabledCategories,
  showSuggestions,
  showActivity,
  suggestionFallbackByCategory,
}: HomeSocialSectionProps) {
  const renderSuggestions = showSuggestions && enabledCategories.length > 0;

  return (
    <>
      {renderSuggestions && (
        <section className={SECTION_SPACING}>
          <HomeSuggestions
            enabledCategories={enabledCategories}
            fallbackByCategory={suggestionFallbackByCategory}
          />
        </section>
      )}

      {renderSuggestions && showActivity && (
        <div className={DIVIDER_WRAP}>
          <Separator className={DIVIDER_STYLE} />
        </div>
      )}

      {showActivity && (
        <section className={SECTION_SPACING}>
          <HomeRecentActivity scope="global" />
        </section>
      )}
    </>
  );
}
