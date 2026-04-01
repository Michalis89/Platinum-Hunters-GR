'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Plus, User } from 'lucide-react';
import { toast } from 'sonner';
import type { CampaignNpc, CampaignNpcPublic } from '@/lib/dnd/types';
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

type NpcsResponse = {
  data?: CampaignNpc[] | CampaignNpcPublic[];
  error?: string;
};

type Npc = CampaignNpc | CampaignNpcPublic;

function npcStatusBadge(status: CampaignNpc['status']) {
  if (status === 'alive') {
    return <Badge className="border-success/30 bg-success/15 text-success">Alive</Badge>;
  }
  if (status === 'dead') {
    return <Badge variant="destructive">Dead</Badge>;
  }
  return <Badge variant="secondary">Unknown</Badge>;
}

export function NpcsList({ campaignId, isDm }: Props) {
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingNpc = useMemo(
    () => npcs.find(item => item.id === editingId) as CampaignNpc | undefined,
    [editingId, npcs],
  );

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    npcs.forEach(npc => npc.tags.forEach(tag => tags.add(tag)));
    return [...tags].sort((a, b) => a.localeCompare(b));
  }, [npcs]);

  const filteredNpcs = useMemo(() => {
    return npcs.filter(npc => {
      const matchesSearch = npc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || npc.status === statusFilter;
      const matchesTag = tagFilter === 'all' || npc.tags.includes(tagFilter);
      return matchesSearch && matchesStatus && matchesTag;
    });
  }, [npcs, searchQuery, statusFilter, tagFilter]);

  useEffect(() => {
    const loadNpcs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dnd/campaigns/${campaignId}/npcs`);
        const payload = (await response.json()) as NpcsResponse;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? 'Failed to load NPCs');
        }

        setNpcs(payload.data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load NPCs';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadNpcs();
  }, [campaignId]);

  const createOrUpdateNpc = async (data: Record<string, unknown>) => {
    const isEditing = Boolean(editingNpc);

    if (isEditing && editingNpc) {
      const previousNpc = editingNpc;
      const optimisticNpc = {
        ...editingNpc,
        ...data,
        name: String(data.name ?? editingNpc.name),
        role: (data.role as string | null | undefined) ?? editingNpc.role,
        status: (data.status as CampaignNpc['status'] | undefined) ?? editingNpc.status,
        description: (data.description as string | null | undefined) ?? editingNpc.description,
        tags: (data.tags as string[] | undefined) ?? editingNpc.tags,
        public_notes: (data.public_notes as string | null | undefined) ?? editingNpc.public_notes,
        secret_notes: isDm
          ? ((data.secret_notes as string | null | undefined) ?? (editingNpc as CampaignNpc).secret_notes)
          : undefined,
        published: Boolean(data.published ?? editingNpc.published),
      } as CampaignNpc;

      setNpcs(current => current.map(item => (item.id === editingNpc.id ? optimisticNpc : item)));

      try {
        const response = await fetch(`/api/dnd/campaigns/${campaignId}/npcs/${editingNpc.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const payload = (await response.json()) as { data?: CampaignNpc; error?: string };
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? 'Failed to update NPC');
        }

        setNpcs(current => current.map(item => (item.id === editingNpc.id ? payload.data! : item)));
        toast.success('NPC updated');
      } catch (error) {
        setNpcs(current => current.map(item => (item.id === previousNpc.id ? previousNpc : item)));
        throw error;
      }

      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticNpc: CampaignNpc = {
      id: tempId,
      campaign_id: campaignId,
      name: String(data.name ?? ''),
      role: (data.role as string | null | undefined) ?? null,
      status: (data.status as CampaignNpc['status'] | undefined) ?? 'alive',
      description: (data.description as string | null | undefined) ?? null,
      tags: (data.tags as string[] | undefined) ?? [],
      public_notes: (data.public_notes as string | null | undefined) ?? null,
      secret_notes: (data.secret_notes as string | null | undefined) ?? null,
      published: Boolean(data.published),
      created_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setNpcs(current => [optimisticNpc, ...current]);

    try {
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/npcs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = (await response.json()) as { data?: CampaignNpc; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to create NPC');
      }

      setNpcs(current => current.map(item => (item.id === tempId ? payload.data! : item)));
      toast.success('NPC created');
    } catch (error) {
      setNpcs(current => current.filter(item => item.id !== tempId));
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!editingNpc) {
      return;
    }

    const previous = [...npcs];
    setNpcs(current => current.filter(item => item.id !== editingNpc.id));

    try {
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/npcs/${editingNpc.id}`, {
        method: 'DELETE',
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to delete NPC');
      }

      toast.success('NPC moved to trash');
    } catch (error) {
      setNpcs(previous);
      throw error;
    }
  };

  const handlePublishedChange = async (npcId: string, published: boolean) => {
    const previous = [...npcs];

    setNpcs(current =>
      current.map(item => (item.id === npcId ? { ...item, published } : item)),
    );

    try {
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/npcs/${npcId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published }),
      });
      const payload = (await response.json()) as { data?: CampaignNpc; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to update visibility');
      }

      setNpcs(current => current.map(item => (item.id === npcId ? payload.data! : item)));
    } catch (error) {
      setNpcs(previous);
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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Input
          value={searchQuery}
          onChange={event => setSearchQuery(event.target.value)}
          placeholder="Search NPCs"
          className="h-12"
        />
        <SelectField
          options={['all', 'alive', 'dead', 'unknown']}
          value={statusFilter}
          onChange={value => setStatusFilter(value || 'all')}
          optionLabels={{ all: 'All statuses', alive: 'Alive', dead: 'Dead', unknown: 'Unknown' }}
        />
        <SelectField
          options={['all', ...allTags]}
          value={tagFilter}
          onChange={value => setTagFilter(value || 'all')}
          optionLabels={{ all: 'All tags' }}
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
            New NPC
          </Button>
        </div>
      ) : null}

      {filteredNpcs.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<User className="h-5 w-5" />}
          title="No NPCs found"
          description={isDm ? 'Create NPCs to populate your world.' : 'No published NPCs yet.'}
        />
      ) : (
        <div className="space-y-3">
          {filteredNpcs.map((npc, index) => (
            <div key={npc.id} className="animate-fade-in-up" style={{ '--stagger': index } as CSSProperties}>
              <EntityCard
                id={npc.id}
                name={npc.name}
                subtitle={npc.role ?? undefined}
                tags={npc.tags}
                published={npc.published}
                publicNotes={npc.public_notes}
                secretNotes={isDm ? (npc as CampaignNpc).secret_notes : undefined}
                isDm={isDm}
                statusBadge={npcStatusBadge(npc.status)}
                onEdit={
                  isDm
                    ? () => {
                        setEditingId(npc.id);
                        setSheetOpen(true);
                      }
                    : undefined
                }
                onPublishedChange={isDm ? value => handlePublishedChange(npc.id, value) : undefined}
              />
            </div>
          ))}
        </div>
      )}

      {isDm ? (
        <EntityFormSheet
          config={{
            entityType: 'npc',
            fields: [
              'name',
              'role',
              'status',
              'description',
              'tags',
              'public_notes',
              'secret_notes',
              'published',
            ],
            statusOptions: [
              { value: 'alive', label: 'Alive' },
              { value: 'dead', label: 'Dead' },
              { value: 'unknown', label: 'Unknown' },
            ],
          }}
          defaultValues={editingNpc as Record<string, unknown> | undefined}
          onSubmit={createOrUpdateNpc}
          onDelete={editingNpc ? handleDelete : undefined}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      ) : null}
    </div>
  );
}
