'use client';

import { useState, type ReactNode } from 'react';
import { Eye, EyeOff, Lock, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

type EntityCardProps = {
  id: string;
  name: string;
  subtitle?: string;
  tags?: string[];
  published: boolean;
  publicNotes?: string | null;
  secretNotes?: string | null;
  isDm: boolean;
  onEdit?: () => void;
  statusBadge?: ReactNode;
  onPublishedChange?: (published: boolean) => Promise<void>;
};

export function EntityCard({
  name,
  subtitle,
  tags = [],
  published,
  publicNotes,
  secretNotes,
  isDm,
  onEdit,
  statusBadge,
  onPublishedChange,
}: EntityCardProps) {
  const [pendingPublish, setPendingPublish] = useState(false);

  const handlePublishedChange = async (nextValue: boolean) => {
    if (!onPublishedChange || pendingPublish) {
      return;
    }

    try {
      setPendingPublish(true);
      await onPublishedChange(nextValue);
    } finally {
      setPendingPublish(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{name}</CardTitle>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>

          <div className="flex items-center gap-2">
            {statusBadge}
            {published ? (
              <Badge className="gap-1 border-success/30 bg-success/15 text-success">
                <Eye className="h-3 w-3" />
                Visible
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <EyeOff className="h-3 w-3" />
                Hidden
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        {publicNotes ? (
          <p className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-serif)' }}>
            {publicNotes}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">No public notes yet.</p>
        )}

        {isDm && secretNotes ? (
          <div className="rounded-lg border border-dashed border-border p-3" style={{ background: 'hsl(var(--accent-muted))' }}>
            <p className="mb-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Lock className="h-3 w-3" />
              DM Only
            </p>
            <p className="text-sm">{secretNotes}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {isDm ? (
            <div className="flex items-center gap-2">
              <Switch
                checked={published}
                onCheckedChange={handlePublishedChange}
                disabled={!onPublishedChange || pendingPublish}
              />
              <span className="text-sm text-muted-foreground">Share with players</span>
            </div>
          ) : <div />}

          {isDm && onEdit ? (
            <Button type="button" variant="outline" size="sm" onClick={onEdit} icon={<Pencil className="h-4 w-4" />}>
              Edit
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
