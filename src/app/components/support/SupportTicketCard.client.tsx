'use client';

import { type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import Badge from '@/app/components/ui/Badge';
import { FormattedDate } from '@/app/components/ui/FormattedDate';
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
    <Card className={UI_CLASSNAMES.panelCard}>
      <CardHeader className="border-[var(--hb-border)]">
        <CardTitle className="flex flex-col gap-2 text-[var(--hb-headline)] md:flex-row md:items-center md:justify-between">
          <span className="flex items-center gap-2">
            {titleIcon}
            {subject}
          </span>
          <Badge text={statusText} color={statusColor} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-[var(--hb-muted)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className={UI_CLASSNAMES.tagPill}>
            {categoryText}
          </span>
          {severityText ? (
            <span className={UI_CLASSNAMES.tagPill}>
              {severityText}
            </span>
          ) : null}
          <span className="flex items-center gap-1 text-[var(--hb-muted)]">
            {updatedLabel ? <span>{updatedLabel}</span> : null}
            <FormattedDate date={updatedAt} options={DATE_TIME_OPTIONS} fallback="" className="text-xs" />
          </span>
        </div>
        {meta}
        <div className="flex flex-wrap gap-2 pt-2">{actions}</div>
      </CardContent>
    </Card>
  );
}
