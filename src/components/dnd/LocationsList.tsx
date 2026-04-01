'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { CampaignLocation, CampaignLocationPublic } from '@/lib/dnd/types';
import { EntityCard } from '@/components/dnd/EntityCard';
import { EntityFormSheet } from '@/components/dnd/EntityFormSheet';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select-field';
import { Spinner } from '@/components/ui/spinner';

type Props = {
  campaignId: string;
  isDm: boolean;
};

type LocationsResponse = {
  data?: CampaignLocation[] | CampaignLocationPublic[];
  error?: string;
};

type Location = CampaignLocation | CampaignLocationPublic;

export function LocationsList({ campaignId, isDm }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingLocation = useMemo(
    () => locations.find(item => item.id === editingId) as CampaignLocation | undefined,
    [editingId, locations],
  );

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    locations.forEach(item => item.tags.forEach(tag => tags.add(tag)));
    return [...tags].sort((a, b) => a.localeCompare(b));
  }, [locations]);

  const allTypes = useMemo(() => {
    const types = new Set<string>();
    locations.forEach(item => {
      if (item.type?.trim()) {
        types.add(item.type.trim());
      }
    });
    return [...types].sort((a, b) => a.localeCompare(b));
  }, [locations]);

  const filteredLocations = useMemo(() => {
    return locations.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesTag = tagFilter === 'all' || item.tags.includes(tagFilter);
      return matchesSearch && matchesType && matchesTag;
    });
  }, [locations, searchQuery, typeFilter, tagFilter]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dnd/campaigns/${campaignId}/locations`);
        const payload = (await response.json()) as LocationsResponse;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? 'Failed to load locations');
        }

        setLocations(payload.data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load locations';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadLocations();
  }, [campaignId]);

  const createOrUpdateLocation = async (data: Record<string, unknown>) => {
    const isEditing = Boolean(editingLocation);

    if (isEditing && editingLocation) {
      const previous = editingLocation;
      const optimistic = {
        ...editingLocation,
        ...data,
        name: String(data.name ?? editingLocation.name),
        type: (data.type as string | null | undefined) ?? editingLocation.type,
        description: (data.description as string | null | undefined) ?? editingLocation.description,
        tags: (data.tags as string[] | undefined) ?? editingLocation.tags,
        public_notes:
          (data.public_notes as string | null | undefined) ?? editingLocation.public_notes,
        secret_notes: isDm
          ? ((data.secret_notes as string | null | undefined) ??
            (editingLocation as CampaignLocation).secret_notes)
          : undefined,
        published: Boolean(data.published ?? editingLocation.published),
      } as CampaignLocation;

      setLocations(current => current.map(item => (item.id === editingLocation.id ? optimistic : item)));

      try {
        const response = await fetch(`/api/dnd/campaigns/${campaignId}/locations/${editingLocation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const payload = (await response.json()) as { data?: CampaignLocation; error?: string };
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? 'Failed to update location');
        }

        setLocations(current => current.map(item => (item.id === editingLocation.id ? payload.data! : item)));
        toast.success('Location updated');
      } catch (error) {
        setLocations(current => current.map(item => (item.id === previous.id ? previous : item)));
        throw error;
      }

      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic: CampaignLocation = {
      id: tempId,
      campaign_id: campaignId,
      name: String(data.name ?? ''),
      type: (data.type as string | null | undefined) ?? null,
      description: (data.description as string | null | undefined) ?? null,
      tags: (data.tags as string[] | undefined) ?? [],
      public_notes: (data.public_notes as string | null | undefined) ?? null,
      secret_notes: (data.secret_notes as string | null | undefined) ?? null,
      published: Boolean(data.published),
      created_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setLocations(current => [optimistic, ...current]);

    try {
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = (await response.json()) as { data?: CampaignLocation; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to create location');
      }

      setLocations(current => current.map(item => (item.id === tempId ? payload.data! : item)));
      toast.success('Location created');
    } catch (error) {
      setLocations(current => current.filter(item => item.id !== tempId));
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!editingLocation) {
      return;
    }

    const previous = [...locations];
    setLocations(current => current.filter(item => item.id !== editingLocation.id));

    try {
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/locations/${editingLocation.id}`, {
        method: 'DELETE',
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to delete location');
      }

      toast.success('Location moved to trash');
    } catch (error) {
      setLocations(previous);
      throw error;
    }
  };

  const handlePublishedChange = async (locationId: string, published: boolean) => {
    const previous = [...locations];
    setLocations(current => current.map(item => (item.id === locationId ? { ...item, published } : item)));

    try {
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/locations/${locationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published }),
      });
      const payload = (await response.json()) as { data?: CampaignLocation; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to update visibility');
      }

      setLocations(current => current.map(item => (item.id === locationId ? payload.data! : item)));
    } catch (error) {
      setLocations(previous);
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
          placeholder="Search locations"
          className="h-12"
        />
        <SelectField
          options={['all', ...allTypes]}
          value={typeFilter}
          onChange={value => setTypeFilter(value || 'all')}
          optionLabels={{ all: 'All types' }}
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
            New Location
          </Button>
        </div>
      ) : null}

      {filteredLocations.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<MapPin className="h-5 w-5" />}
          title="No locations found"
          description={isDm ? 'Add places to your world map.' : 'No published locations yet.'}
        />
      ) : (
        <div className="space-y-3">
          {filteredLocations.map((location, index) => (
            <div key={location.id} className="animate-fade-in-up" style={{ '--stagger': index } as CSSProperties}>
              <EntityCard
                id={location.id}
                name={location.name}
                subtitle={location.type ?? undefined}
                tags={location.tags}
                published={location.published}
                publicNotes={location.public_notes}
                secretNotes={isDm ? (location as CampaignLocation).secret_notes : undefined}
                isDm={isDm}
                onEdit={
                  isDm
                    ? () => {
                        setEditingId(location.id);
                        setSheetOpen(true);
                      }
                    : undefined
                }
                onPublishedChange={isDm ? value => handlePublishedChange(location.id, value) : undefined}
              />
            </div>
          ))}
        </div>
      )}

      {isDm ? (
        <EntityFormSheet
          config={{
            entityType: 'location',
            fields: ['name', 'type', 'description', 'tags', 'public_notes', 'secret_notes', 'published'],
          }}
          defaultValues={editingLocation as Record<string, unknown> | undefined}
          onSubmit={createOrUpdateLocation}
          onDelete={editingLocation ? handleDelete : undefined}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      ) : null}
    </div>
  );
}
