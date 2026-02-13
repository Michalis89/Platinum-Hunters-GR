'use client';

import useSWR from 'swr';
import {
  Sparkles,
  Gamepad2,
  CheckCircle2,
  Clock4,
  BookOpen,
  Sun,
  Layers,
  Book,
  Film,
  AlertTriangle,
  RefreshCw,
  Star,
  Volume2,
  Target,
  Monitor,
  Heart,
  Scale,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PersonalSuggestionCard } from '@/lib/dashboard/category-data';
import { apiClient } from '@/lib/api/client';

const ICON_MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  'gamepad-2': Gamepad2,
  'check-circle-2': CheckCircle2,
  'clock-4': Clock4,
  'book-open': BookOpen,
  sun: Sun,
  layers: Layers,
  book: Book,
  film: Film,
  alert: AlertTriangle,
  'refresh-cw': RefreshCw,
  star: Star,
  volume: Volume2,
  target: Target,
  monitor: Monitor,
  heart: Heart,
  scale: Scale,
};

const fetcher = apiClient.swrFetcher;

type DashboardSuggestionsResponse = {
  data: {
    suggestions?: PersonalSuggestionCard[];
  };
};

export default function PersonalSuggestions() {
  const { data, error } = useSWR<DashboardSuggestionsResponse>(
    '/api/dashboard/suggestions',
    fetcher,
    { revalidateOnFocus: false },
  );

  const suggestions = data?.data?.suggestions ?? [];
  const isLoading = !data && !error;
  const visibleSuggestions = suggestions.slice(0, 4);

  if (!isLoading && visibleSuggestions.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card
            key={`skeleton-${index}`}
            className="flex animate-pulse flex-col gap-3 border bg-card p-4"
          >
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
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {visibleSuggestions.map(suggestion => {
        const Icon = ICON_MAP[suggestion.icon] ?? Sparkles;
        return (
          <Card key={suggestion.id} className="flex flex-col gap-3 border bg-card p-4">
            <div className="flex items-center justify-between">
              <Icon className="h-5 w-5 text-primary" />
              {suggestion.ctaLabel && (
                <Button variant="ghost" size="sm">
                  {suggestion.ctaLabel}
                </Button>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{suggestion.title}</p>
              <p className="text-xs text-muted-foreground">{suggestion.explanation}</p>
              <p className="text-sm font-medium text-foreground">{suggestion.stat}</p>
              {suggestion.supportingText && (
                <p className="text-xs text-muted-foreground">{suggestion.supportingText}</p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
