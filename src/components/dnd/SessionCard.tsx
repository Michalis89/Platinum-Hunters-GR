'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Eye, EyeOff, Pencil } from 'lucide-react';
import type { CampaignSession, CampaignSessionPublic } from '@/lib/dnd/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  session: CampaignSession | CampaignSessionPublic;
  isDm: boolean;
  onEdit?: () => void;
};

function formatSessionDate(dateValue: string | null): string {
  if (!dateValue) {
    return 'Date not set';
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return 'Date not set';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

function getStatusBadge(status: CampaignSession['status']) {
  if (status === 'played') {
    return <Badge className="border-success/30 bg-success/15 text-success">Played</Badge>;
  }

  if (status === 'cancelled') {
    return <Badge variant="destructive">Cancelled</Badge>;
  }

  return <Badge variant="secondary">Planned</Badge>;
}

export function SessionCard({ session, isDm, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false);

  const recapText = session.recap?.trim() ?? '';
  const hasLongRecap = recapText.length > 220;
  const previewText = useMemo(() => {
    if (!hasLongRecap || expanded) {
      return recapText;
    }

    return `${recapText.slice(0, 220).trim()}...`;
  }, [expanded, hasLongRecap, recapText]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{session.title}</CardTitle>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {formatSessionDate(session.session_date)}
            </p>
          </div>

          {isDm ? (
            <div className="flex items-center gap-2">
              {getStatusBadge(session.status)}
              {session.recap_published ? (
                <Eye className="h-4 w-4 text-success" aria-label="Published" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" aria-label="Not published" />
              )}
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {isDm ? (
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onEdit} icon={<Pencil className="h-4 w-4" />}>
              Edit
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-serif)' }}>
              {previewText || 'No recap available yet.'}
            </p>
            {hasLongRecap ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(current => !current)}
              >
                {expanded ? 'Read less' : 'Read more'}
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
