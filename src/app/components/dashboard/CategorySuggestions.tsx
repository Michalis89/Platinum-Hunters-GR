'use client';

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

type CategorySuggestionsProps = {
  suggestions: PersonalSuggestionCard[];
};

export default function CategorySuggestions({ suggestions }: CategorySuggestionsProps) {
  const visibleSuggestions = suggestions.slice(0, 4);

  if (!visibleSuggestions.length) {
    return null;
  }

  // Check if all suggestions are "empty" suggestions (no actual data)
  const hasRealData = visibleSuggestions.some(
    suggestion => !suggestion.id.startsWith('empty-suggest-'),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">
          {hasRealData ? 'Personal Insights' : 'Insights Coming Soon'}
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visibleSuggestions.map(suggestion => {
          const Icon = ICON_MAP[suggestion.icon] ?? Sparkles;
          const isEmpty = suggestion.id.startsWith('empty-suggest-');

          return (
            <Card
              key={suggestion.id}
              className={`flex flex-col gap-3 border p-4 ${isEmpty ? 'bg-muted/30' : 'bg-card'}`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`h-5 w-5 ${isEmpty ? 'text-muted-foreground' : 'text-primary'}`} />
                {suggestion.ctaLabel && !isEmpty && (
                  <Button variant="ghost" size="sm">
                    {suggestion.ctaLabel}
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                <p className={`text-sm font-semibold ${isEmpty ? 'text-muted-foreground' : ''}`}>
                  {suggestion.title}
                </p>
                <p className="text-xs text-muted-foreground">{suggestion.explanation}</p>
                <p
                  className={`text-sm font-medium ${isEmpty ? 'text-muted-foreground' : 'text-foreground'}`}
                >
                  {suggestion.stat}
                </p>
                {suggestion.supportingText && (
                  <p className="text-xs text-muted-foreground">{suggestion.supportingText}</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
