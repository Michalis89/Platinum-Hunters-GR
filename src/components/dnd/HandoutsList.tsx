'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { CampaignHandout } from '@/lib/dnd/types';
import { HandoutFormSheet } from '@/components/dnd/HandoutFormSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';

type Props = {
  campaignId: string;
  isDm: boolean;
};

type HandoutsResponse = {
  data?: CampaignHandout[];
  error?: string;
};

export function HandoutsList({ campaignId, isDm }: Props) {
  const [handouts, setHandouts] = useState<CampaignHandout[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingHandout = useMemo(
    () => handouts.find(item => item.id === editingId),
    [editingId, handouts],
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dnd/campaigns/${campaignId}/handouts`);
        const payload = (await response.json()) as HandoutsResponse;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? 'Failed to load handouts');
        }

        setHandouts(payload.data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load handouts';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [campaignId]);

  const upsertHandout = async (values: { title: string; content: string; published: boolean }) => {
    if (!isDm) {
      return;
    }

    if (editingHandout) {
      const previous = editingHandout;
      const optimistic: CampaignHandout = {
        ...editingHandout,
        title: values.title,
        content: values.content || null,
        published: values.published,
      };

      setHandouts(current => current.map(item => (item.id === editingHandout.id ? optimistic : item)));

      try {
        const response = await fetch(`/api/dnd/campaigns/${campaignId}/handouts/${editingHandout.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: values.title,
            content: values.content || null,
            published: values.published,
          }),
        });
        const payload = (await response.json()) as { data?: CampaignHandout; error?: string };
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? 'Failed to update handout');
        }

        setHandouts(current => current.map(item => (item.id === editingHandout.id ? payload.data! : item)));
        toast.success('Handout updated');
      } catch (error) {
        setHandouts(current => current.map(item => (item.id === previous.id ? previous : item)));
        throw error;
      }

      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic: CampaignHandout = {
      id: tempId,
      campaign_id: campaignId,
      title: values.title,
      content: values.content || null,
      published: values.published,
      created_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setHandouts(current => [optimistic, ...current]);

    try {
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/handouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          content: values.content || null,
          published: values.published,
        }),
      });
      const payload = (await response.json()) as { data?: CampaignHandout; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to create handout');
      }

      setHandouts(current => current.map(item => (item.id === tempId ? payload.data! : item)));
      toast.success('Handout created');
    } catch (error) {
      setHandouts(current => current.filter(item => item.id !== tempId));
      throw error;
    }
  };

  const togglePublished = async (id: string, published: boolean) => {
    const previous = [...handouts];
    setHandouts(current => current.map(item => (item.id === id ? { ...item, published } : item)));

    try {
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/handouts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published }),
      });
      const payload = (await response.json()) as { data?: CampaignHandout; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to update handout visibility');
      }

      setHandouts(current => current.map(item => (item.id === id ? payload.data! : item)));
    } catch (error) {
      setHandouts(previous);
      const message = error instanceof Error ? error.message : 'Failed to update handout visibility';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isDm ? (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => {
              setEditingId(null);
              setSheetOpen(true);
            }}
            icon={<Plus className="h-4 w-4" />}
          >
            New Handout
          </Button>
        </div>
      ) : null}

      {handouts.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<BookOpen className="h-5 w-5" />}
          title="No handouts yet"
          description={isDm ? 'Create your first handout.' : 'No published handouts yet.'}
        />
      ) : (
        <div className="space-y-3">
          {handouts.map((handout, index) => (
            <Card key={handout.id} className="animate-fade-in-up shadow-sm" style={{ '--stagger': index } as CSSProperties}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base font-semibold">{handout.title}</CardTitle>
                  {handout.published ? (
                    <Badge className="border-success/30 bg-success/15 text-success">Published</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Draft</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {handout.content?.trim() || 'No content yet.'}
                </p>

                {isDm ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={handout.published}
                        onCheckedChange={nextValue => void togglePublished(handout.id, nextValue)}
                      />
                      <span className="text-sm text-muted-foreground">Share with players</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(handout.id);
                        setSheetOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isDm ? (
        <HandoutFormSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          defaultValues={
            editingHandout
              ? {
                  title: editingHandout.title,
                  content: editingHandout.content ?? '',
                  published: editingHandout.published,
                }
              : undefined
          }
          onSubmit={upsertHandout}
        />
      ) : null}
    </div>
  );
}
