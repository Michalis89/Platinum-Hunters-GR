'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { GameSuggestion } from '@/lib/dashboard/gameSuggestionsEngine';

const fetcher = apiClient.swrFetcher;

function SkeletonCard() {
  return (
    <Card className="flex animate-pulse flex-col gap-3 border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="h-5 w-5 rounded bg-muted/30" />
        <span className="h-7 w-16 rounded bg-muted/30" />
      </div>
      <div className="space-y-2">
        <span className="block h-4 w-3/4 rounded bg-muted/30" />
        <span className="block h-3 w-5/6 rounded bg-muted/30" />
        <span className="block h-4 w-1/2 rounded bg-muted/30" />
      </div>
    </Card>
  );
}

export default function GameSuggestions() {
  const { data, error } = useSWR<GameSuggestion[]>('/api/dashboard/game-suggestions', fetcher, {
    revalidateOnFocus: false,
  });

  if (error) {
    return null;
  }

  if (!data) {
    return (
      <section className="pt-10 md:pt-12">
        <div className="mx-auto max-w-screen-2xl px-4 md:px-6">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-lg font-semibold">Game picks based on your history</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={`skeleton-${index}`} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (data.length === 0) {
    return null;
  }

  return (
    <section className="pt-10 md:pt-12">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-6">
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-lg font-semibold">Game picks based on your history</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {data.slice(0, 4).map(suggestion => (
            <Card
              key={`${suggestion.igdbId}-${suggestion.title}`}
              className="flex flex-col gap-4 border bg-card p-4"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{suggestion.title}</p>
                <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[13px] font-medium text-foreground">{suggestion.signals}</p>
                <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Confidence {Math.round(suggestion.confidence * 100)}%
                </p>
              </div>
              <div className="mt-auto">
                {suggestion.slug && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/media/games/${suggestion.slug}`}>View details</Link>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
