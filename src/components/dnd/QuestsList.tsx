'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Flag, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { CampaignQuest, CampaignQuestPublic } from '@/lib/dnd/types';
import { EntityCard } from '@/components/dnd/EntityCard';
import { EntityFormSheet } from '@/components/dnd/EntityFormSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select-field';
import { Spinner } from '@/components/ui/spinner';

type Props = {
  campaignId: string;
  isDm: boolean;
};

type QuestsResponse = {
  data?: CampaignQuest[] | CampaignQuestPublic[];
  error?: string;
};

type Quest = CampaignQuest | CampaignQuestPublic;

function questStatusBadge(status: CampaignQuest['status']) {
  if (status === 'active') {
    return <Badge className="border-primary/30 bg-primary/15 text-primary">Active</Badge>;
  }
  if (status === 'completed') {
    return <Badge className="border-success/30 bg-success/15 text-success">Completed</Badge>;
  }
  if (status === 'failed') {
    return <Badge variant="destructive">Failed</Badge>;
  }
  return <Badge variant="secondary">On Hold</Badge>;
}

export function QuestsList({ campaignId, isDm }: Props) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingQuest = useMemo(
    () => quests.find(item => item.id === editingId) as CampaignQuest | undefined,
    [editingId, quests],
  );

  const filteredQuests = useMemo(() => {
    return quests.filter(quest => {
      const matchesSearch = quest.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || quest.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quests, searchQuery, statusFilter]);

  useEffect(() => {
    const loadQuests = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dnd/campaigns/${campaignId}/quests`);
        const payload = (await response.json()) as QuestsResponse;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? 'Failed to load quests');
        }

        setQuests(payload.data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load quests';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadQuests();
  }, [campaignId]);

  const createOrUpdateQuest = async (data: Record<string, unknown>) => {
    const isEditing = Boolean(editingQuest);

    if (isEditing && editingQuest) {
      const previous = editingQuest;
      const optimistic = {
        ...editingQuest,
        ...data,
        title: String(data.title ?? editingQuest.title),
        status: (data.status as CampaignQuest['status'] | undefined) ?? editingQuest.status,
        summary: (data.summary as string | null | undefined) ?? editingQuest.summary,
        public_notes: (data.public_notes as string | null | undefined) ?? editingQuest.public_notes,
        secret_notes: isDm
          ? ((data.secret_notes as string | null | undefined) ??
            (editingQuest as CampaignQuest).secret_notes)
          : undefined,
        published: Boolean(data.published ?? editingQuest.published),
      } as CampaignQuest;

      setQuests(current => current.map(item => (item.id === editingQuest.id ? optimistic : item)));

      try {
        const response = await fetch(`/api/dnd/campaigns/${campaignId}/quests/${editingQuest.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const payload = (await response.json()) as { data?: CampaignQuest; error?: string };
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? 'Failed to update quest');
        }

        setQuests(current => current.map(item => (item.id === editingQuest.id ? payload.data! : item)));
        toast.success('Quest updated');
      } catch (error) {
        setQuests(current => current.map(item => (item.id === previous.id ? previous : item)));
        throw error;
      }

      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic: CampaignQuest = {
      id: tempId,
      campaign_id: campaignId,
      title: String(data.title ?? ''),
      status: (data.status as CampaignQuest['status'] | undefined) ?? 'active',
      summary: (data.summary as string | null | undefined) ?? null,
      public_notes: (data.public_notes as string | null | undefined) ?? null,
      secret_notes: (data.secret_notes as string | null | undefined) ?? null,
      published: Boolean(data.published),
      created_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setQuests(current => [optimistic, ...current]);

    try {
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = (await response.json()) as { data?: CampaignQuest; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to create quest');
      }

      setQuests(current => current.map(item => (item.id === tempId ? payload.data! : item)));
      toast.success('Quest created');
    } catch (error) {
      setQuests(current => current.filter(item => item.id !== tempId));
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!editingQuest) {
      return;
    }

    const previous = [...quests];
    setQuests(current => current.filter(item => item.id !== editingQuest.id));

    try {
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/quests/${editingQuest.id}`, {
        method: 'DELETE',
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to delete quest');
      }

      toast.success('Quest moved to trash');
    } catch (error) {
      setQuests(previous);
      throw error;
    }
  };

  const handlePublishedChange = async (questId: string, published: boolean) => {
    const previous = [...quests];
    setQuests(current => current.map(item => (item.id === questId ? { ...item, published } : item)));

    try {
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/quests/${questId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published }),
      });
      const payload = (await response.json()) as { data?: CampaignQuest; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to update visibility');
      }

      setQuests(current => current.map(item => (item.id === questId ? payload.data! : item)));
    } catch (error) {
      setQuests(previous);
      throw error;
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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input
          value={searchQuery}
          onChange={event => setSearchQuery(event.target.value)}
          placeholder="Search quests"
          className="h-12"
        />
        <SelectField
          options={['all', 'active', 'completed', 'failed', 'on_hold']}
          value={statusFilter}
          onChange={value => setStatusFilter(value || 'all')}
          optionLabels={{
            all: 'All statuses',
            active: 'Active',
            completed: 'Completed',
            failed: 'Failed',
            on_hold: 'On Hold',
          }}
        />
      </div>

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
            New Quest
          </Button>
        </div>
      ) : null}

      {filteredQuests.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<Flag className="h-5 w-5" />}
          title="No quests found"
          description={isDm ? 'Add quests for your party.' : 'No published quests yet.'}
        />
      ) : (
        <div className="space-y-3">
          {filteredQuests.map((quest, index) => (
            <div key={quest.id} className="animate-fade-in-up" style={{ '--stagger': index } as CSSProperties}>
              <EntityCard
                id={quest.id}
                name={quest.title}
                subtitle={quest.status.replace('_', ' ')}
                published={quest.published}
                publicNotes={quest.public_notes ?? quest.summary}
                secretNotes={isDm ? (quest as CampaignQuest).secret_notes : undefined}
                isDm={isDm}
                statusBadge={questStatusBadge(quest.status)}
                onEdit={
                  isDm
                    ? () => {
                        setEditingId(quest.id);
                        setSheetOpen(true);
                      }
                    : undefined
                }
                onPublishedChange={isDm ? value => handlePublishedChange(quest.id, value) : undefined}
              />
            </div>
          ))}
        </div>
      )}

      {isDm ? (
        <EntityFormSheet
          config={{
            entityType: 'quest',
            fields: ['title', 'status', 'summary', 'public_notes', 'secret_notes', 'published'],
            statusOptions: [
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'failed', label: 'Failed' },
              { value: 'on_hold', label: 'On Hold' },
            ],
          }}
          defaultValues={editingQuest as Record<string, unknown> | undefined}
          onSubmit={createOrUpdateQuest}
          onDelete={editingQuest ? handleDelete : undefined}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      ) : null}
    </div>
  );
}
