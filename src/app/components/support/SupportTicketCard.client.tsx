'use client';

import { type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormattedDate } from '@/utils/components/FormattedDate';
import { DATE_TIME_OPTIONS, UI_CLASSNAMES } from '@/lib/constants/ui';

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
  return (
    <Card className={`${UI_CLASSNAMES.panelCard} `}>
      <CardHeader className="bg-transparent">
        <CardTitle className="flex flex-col gap-2 text-foreground md:flex-row md:items-center md:justify-between">
          <span className="flex items-center gap-2 text-base font-semibold">
            {titleIcon}
            {subject}
          </span>
          <Badge
            variant={
              statusColor === 'green'
                ? 'default'
                : statusColor === 'blue'
                  ? 'default'
                  : statusColor === 'yellow'
                    ? 'outline'
                    : statusColor === 'red'
                      ? 'destructive'
                      : 'secondary'
            }
          >
            {statusText}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`${UI_CLASSNAMES.tagPill} px-3 py-1`}>{categoryText}</span>
          {severityText ? (
            <span className={`${UI_CLASSNAMES.tagPill} px-3 py-1`}>{severityText}</span>
          ) : null}
          <span className="flex items-center gap-1 text-muted-foreground">
            {updatedLabel ? <span>{updatedLabel}</span> : null}
            <FormattedDate
              date={updatedAt}
              options={DATE_TIME_OPTIONS}
              fallback=""
              className="text-xs"
            />
          </span>
        </div>
        {meta}
        <div className="flex flex-wrap gap-2 pt-1">{actions}</div>
      </CardContent>
    </Card>
  );
}
