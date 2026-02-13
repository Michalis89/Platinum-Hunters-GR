'use client';

import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { CategorySpotlightCard } from '@/lib/dashboard/category-data';

type CategorySpotlightsProps = {
  cards: CategorySpotlightCard[];
};

export default function CategorySpotlights({ cards }: CategorySpotlightsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map(card => (
        <Card
          key={card.id}
          className="rounded-2xl border border-border/60 bg-card/80 text-card-foreground shadow-sm transition hover:border-foreground/30 hover:shadow-md"
        >
          <CardHeader className="flex items-center justify-between gap-3 space-y-0 px-6 pb-1 pt-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              {card.title}
            </p>
            <Badge variant="secondary" className="rounded-full text-[11px]">
              {card.dataSubtitle}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-4 pt-0">
            <p className="text-sm font-semibold leading-snug text-foreground line-clamp-3">
              {card.explanation}
            </p>
            {card.entry && (
              <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/30 p-3">
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl bg-muted">
                  {card.entry.cover ? (
                    <Image
                      src={card.entry.cover}
                      alt={card.entry.title ?? 'Entry cover'}
                      fill
                      className="object-cover"
                      sizes="56px"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Sparkles className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  {card.entry.title && (
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {card.entry.title}
                    </p>
                  )}
                  {card.entry.detail && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {card.entry.detail}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          {card.ctaLabel && (
            <CardFooter className="px-6 py-3 pt-0">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-[11px]"
                icon={<ArrowRight className="h-3 w-3" />}
                type="button"
              >
                {card.ctaLabel}
              </Button>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
