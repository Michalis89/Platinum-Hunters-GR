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
    <Card className="border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Platform Insight</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{summary}</p>

        <Collapsible className="overflow-hidden rounded-lg border border-border/60">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="group flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
            >
              <span>View detailed breakdown</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Dropped</TableHead>
                  <TableHead className="text-right">Completion %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length > 0 ? (
                  rows.map(row => (
                    <TableRow key={row.platform}>
                      <TableCell className="font-medium">{row.platform}</TableCell>
                      <TableCell className="text-right">{row.total}</TableCell>
                      <TableCell className="text-right">{row.completed}</TableCell>
                      <TableCell className="text-right">{row.dropped}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="font-medium">
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
