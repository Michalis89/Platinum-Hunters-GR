'use client';

import { useState } from 'react';
import { BookOpen, Dice6 } from 'lucide-react';
import type {
  ConditionDetail,
  GenericDetail,
  MagicItemDetail,
  MonsterDetail,
  ReferenceSearchResult,
  SpellDetail,
} from '@/lib/dnd/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ReferenceDetailCard } from '@/components/dnd/ReferenceDetailCard';
import { ReferenceSearch } from '@/components/dnd/ReferenceSearch';

type ReferenceDetailPayload = SpellDetail | MonsterDetail | ConditionDetail | MagicItemDetail | GenericDetail;

type DetailResponse = {
  data?: ReferenceDetailPayload;
  error?: string;
};

type ReferenceLookupPanelProps = {
  asSheet?: boolean;
};

function ReferenceLookupContent() {
  const [selectedResult, setSelectedResult] = useState<ReferenceSearchResult | null>(null);
  const [detail, setDetail] = useState<ReferenceDetailPayload | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const handleSelect = async (result: ReferenceSearchResult) => {
    setSelectedResult(result);
    setLoadingDetail(true);
    setDetail(null);
    setDetailError(null);

    try {
      const response = await fetch(`/api/dnd/reference/detail?url=${encodeURIComponent(result.url)}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const payload = (await response.json()) as DetailResponse;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Unable to load details.');
      }

      setDetail(payload.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load details.';
      setDetailError(message);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px,1fr]">
      <Card className="h-fit border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Search Open5e</CardTitle>
        </CardHeader>
        <CardContent>
          <ReferenceSearch onSelect={handleSelect} selectedUrl={selectedResult?.url ?? null} />
        </CardContent>
      </Card>

      <ReferenceDetailCard
        result={selectedResult}
        detail={detail}
        loading={loadingDetail}
        error={detailError}
      />
    </div>
  );
}

export function ReferenceLookupPanel({ asSheet = false }: ReferenceLookupPanelProps) {
  const [open, setOpen] = useState(false);

  if (!asSheet) {
    return <ReferenceLookupContent />;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button type="button" variant="secondary" icon={<Dice6 className="size-4" />} onClick={() => setOpen(true)}>
        Reference Lookup
      </Button>
      <SheetContent
        side="right"
        className="h-[100dvh] w-full max-w-none border-l border-border p-0 sm:w-[92vw] sm:max-w-4xl"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="size-4" />
            D&D Reference
          </SheetTitle>
          <SheetDescription>Search spells, monsters, magic items, feats, planes and more via Open5e.</SheetDescription>
        </SheetHeader>
        <div className="h-[calc(100dvh-86px)] overflow-y-auto p-4 md:p-5">
          <ReferenceLookupContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}
