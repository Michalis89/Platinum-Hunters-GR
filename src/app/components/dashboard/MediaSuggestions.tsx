'use client';

import Link from 'next/link';
import { CoverThumbImage, IMAGE_SIZES } from '@/components/ui/cover-image';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { MediaSuggestion } from '@/lib/dashboard/category-data';
import { DEFAULT_COVER } from '@/lib/constants/messages';

type MediaSuggestionsProps = {
  suggestions: MediaSuggestion[];
  category: string;
};

function SuggestionCard({ suggestion }: { suggestion: MediaSuggestion }) {
  return (
    <Card className="relative min-h-[170px] overflow-hidden border-border/45 bg-card/85 shadow-[0_12px_28px_-20px_rgba(0,0,0,0.85)]">
      <div className="absolute inset-0">
        <CoverThumbImage
          src={suggestion.cover || DEFAULT_COVER}
          alt={suggestion.title}
          className="object-cover"
          sizes={IMAGE_SIZES.grid3}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/10" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-end p-3 sm:p-4">
        <div className="space-y-1.5">
          <p className="line-clamp-2 text-sm font-semibold leading-tight text-white sm:text-base">
            {suggestion.title}
          </p>
          <p className="line-clamp-2 text-xs text-white/85">{suggestion.reason}</p>
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/75">Confidence</p>
            <p className="text-xs font-semibold text-white sm:text-sm">
              {Math.round(suggestion.confidence * 100)}%
            </p>
          </div>
          {suggestion.slug && (
            <Button
              size="sm"
              variant="secondary"
              className="h-8 border-white/30 bg-white/15 px-2.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/25"
              asChild
            >
              <Link href={`/media/${suggestion.category}/${suggestion.slug}`}>View details</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function SuggestionColumn({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: MediaSuggestion[];
  emptyLabel: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/90">
          {title}
        </p>
        <span className="text-xs text-muted-foreground/80">{items.length}/4</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/55 bg-card/40 p-5 text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
          {items.map(suggestion => (
            <SuggestionCard
              key={`media-suggestion-${suggestion.source}-${suggestion.mediaId}`}
              suggestion={suggestion}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ category }: { category: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <div className="rounded-full bg-muted p-3">
          <Sparkles className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">
            Not enough data yet for {category}
          </h3>
          <p className="text-sm text-muted-foreground">
            We need more data to show personalized recommendations based on your preferences.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Generates a dynamic label based on suggestion sources
 */
function generateSuggestionsLabel(suggestions: MediaSuggestion[]): string {
  const backlogCount = suggestions.filter(s => s.source === 'backlog').length;
  const dbCount = suggestions.filter(
    s => s.source === 'database' || s.source === 'database-fallback',
  ).length;

  if (backlogCount === 0 && dbCount === 0) {
    return '';
  }

  if (backlogCount === 0) {
    return dbCount === 1 ? '1 strong pick for you' : `${dbCount} strong picks for you`;
  }

  if (dbCount === 0) {
    return backlogCount === 1 ? '1 backlog pick' : `${backlogCount} backlog picks`;
  }

  // Both exist
  return `${backlogCount} backlog + ${dbCount} database picks`;
}

export default function MediaSuggestions({ suggestions, category }: MediaSuggestionsProps) {
  const backlogSuggestions = suggestions.filter(s => s.source === 'backlog').slice(0, 4);
  const databaseSuggestions = suggestions
    .filter(s => s.source === 'database' || s.source === 'database-fallback')
    .slice(0, 4);
  const visibleSuggestions = [...backlogSuggestions, ...databaseSuggestions];
  const suggestionsLabel = generateSuggestionsLabel(visibleSuggestions);

  return (
    <section className="space-y-5 rounded-2xl border border-border/40 bg-muted/[0.08] p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-semibold">Recommended for you</h3>
          <span className="rounded-full border border-border/50 bg-card/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/90">
            Personalized
          </span>
        </div>
        {visibleSuggestions.length > 0 && suggestionsLabel && (
          <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            {suggestionsLabel}
          </span>
        )}
      </div>

      {visibleSuggestions.length === 0 ? (
        <EmptyState category={category} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <SuggestionColumn
            title="Backlog Picks"
            items={backlogSuggestions}
            emptyLabel="No backlog suggestions right now."
          />
          <SuggestionColumn
            title="Database Picks"
            items={databaseSuggestions}
            emptyLabel="No database suggestions right now."
          />
        </div>
      )}
    </section>
  );
}
