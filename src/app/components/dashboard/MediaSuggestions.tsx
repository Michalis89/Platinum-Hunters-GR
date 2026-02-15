'use client';

import Link from 'next/link';
import { CoverThumbImage, THUMB_SIZES_TINY } from '@/components/ui/cover-image';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { MediaSuggestion } from '@/lib/dashboard/category-data';
import { DEFAULT_COVER } from '@/lib/constants/messages';

type MediaSuggestionsProps = {
  suggestions: MediaSuggestion[];
  category: string;
};

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

export default function MediaSuggestions({ suggestions, category }: MediaSuggestionsProps) {
  const visibleSuggestions = suggestions.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Recommended for you</h3>
        {visibleSuggestions.length > 0 && (
          <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            2 backlog + 2 database picks
          </span>
        )}
      </div>

      {visibleSuggestions.length === 0 ? (
        <EmptyState category={category} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleSuggestions.map(suggestion => (
            <Card
              key={`media-suggestion-${suggestion.mediaId}`}
              className="flex flex-col gap-4 border bg-card p-4"
            >
              <div className="flex gap-3">
                <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded">
                  <CoverThumbImage
                    src={suggestion.cover || DEFAULT_COVER}
                    alt={suggestion.title}
                    className="object-cover"
                    sizes={THUMB_SIZES_TINY}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {suggestion.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {suggestion.reason}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    Confidence
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {Math.round(suggestion.confidence * 100)}%
                  </p>
                </div>
                {suggestion.slug && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/media/${suggestion.category}/${suggestion.slug}`}>
                      View details
                    </Link>
                  </Button>
                )}
              </div>

              {suggestion.genres && suggestion.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {suggestion.genres.slice(0, 3).map((genre, idx) => (
                    <span
                      key={`${suggestion.mediaId}-genre-${idx}`}
                      className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
