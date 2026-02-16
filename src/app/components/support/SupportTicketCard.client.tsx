'use client';

import { type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormattedDate } from '@/utils/components/FormattedDate';
import { DATE_TIME_OPTIONS } from '@/lib/constants/ui';

type SupportTicketCardProps = {
  subject: string;
  statusText: string;
  statusColor: string;
  categoryText: string;
  severityText?: string | null;
  updatedAt: string;
  updatedLabel?: string;
  titleIcon?: ReactNode;
  meta?: ReactNode;
  actions: ReactNode;
};

export default function SupportTicketCard({
  subject,
  statusText,
  statusColor,
  categoryText,
  severityText,
  updatedAt,
  updatedLabel,
  titleIcon,
  meta,
  actions,
}: SupportTicketCardProps) {
  const isAwaitingResponse = statusText === 'Awaiting your response';
  const badgeVariant = isAwaitingResponse ? 'outline' : statusColor === 'red' ? 'destructive' : 'secondary';

  return (
    <Card className="rounded-2xl border border-border/30 bg-card shadow-md shadow-black/5 transition-shadow hover:shadow-lg hover:shadow-black/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-col gap-2 text-foreground md:flex-row md:items-center md:justify-between">
          <span className="flex items-center gap-2 text-base font-semibold">
            {titleIcon}
            {subject}
          </span>
          <Badge variant={badgeVariant} className={isAwaitingResponse ? 'border-primary/40 text-primary' : ''}>
            {statusText}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{categoryText}</span>
          {severityText ? <span>{severityText}</span> : null}
          <span className="flex items-center gap-1">
            {updatedLabel ? <span>{updatedLabel}</span> : null}
            <FormattedDate date={updatedAt} options={DATE_TIME_OPTIONS} fallback="" />
          </span>
        </div>
        {meta}
        {actions}
      </CardContent>
    </Card>
  );
}
