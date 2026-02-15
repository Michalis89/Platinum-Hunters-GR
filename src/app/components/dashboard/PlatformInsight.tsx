'use client';

import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PlatformInsightPayload } from '@/lib/dashboard/category-data';

type PlatformInsightProps = {
  payload: PlatformInsightPayload | null;
};

export default function PlatformInsight({ payload }: PlatformInsightProps) {
  const summary = payload?.summary ?? 'Not enough data to compare platforms yet.';
  const rows = payload?.rows ?? [];

  return (
    <Card className="border-border/40 bg-card/75 shadow-[0_8px_24px_-24px_rgba(0,0,0,0.85)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Platform Insight</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground/85">{summary}</p>

        <Collapsible className="overflow-hidden rounded-lg border border-border/40 bg-muted/[0.04]">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="group flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/45"
            >
              <span>View detailed breakdown</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-border/40">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-3 py-3">Platform</TableHead>
                  <TableHead className="px-3 py-3 text-right">Total</TableHead>
                  <TableHead className="px-3 py-3 text-right">Completed</TableHead>
                  <TableHead className="px-3 py-3 text-right">Dropped</TableHead>
                  <TableHead className="px-3 py-3 text-right">Completion %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length > 0 ? (
                  rows.map((row, index) => (
                    <TableRow
                      key={row.platform}
                      className={`${index % 2 === 0 ? 'bg-muted/[0.03]' : 'bg-transparent'} hover:bg-muted/40`}
                    >
                      <TableCell className="px-3 py-3 font-medium">{row.platform}</TableCell>
                      <TableCell className="px-3 py-3 text-right">{row.total}</TableCell>
                      <TableCell className="px-3 py-3 text-right">{row.completed}</TableCell>
                      <TableCell className="px-3 py-3 text-right">{row.dropped}</TableCell>
                      <TableCell className="px-3 py-3 text-right">
                        <Badge variant="outline" className="border-border/60 font-semibold">
                          {row.completionRate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No game entries found yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
