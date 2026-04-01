'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { TrashButton } from '@/components/dnd/TrashButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/ui/select-field';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { TagInput } from '@/components/dnd/TagInput';

type EntityFormConfig = {
  entityType: 'npc' | 'location' | 'quest';
  fields: (
    | 'name'
    | 'title'
    | 'role'
    | 'type'
    | 'status'
    | 'description'
    | 'summary'
    | 'tags'
    | 'public_notes'
    | 'secret_notes'
    | 'published'
  )[];
  statusOptions?: { value: string; label: string }[];
};

type Props = {
  config: EntityFormConfig;
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onDelete?: () => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function titleFromEntityType(entityType: EntityFormConfig['entityType']): string {
  if (entityType === 'npc') {
    return 'NPC';
  }
  if (entityType === 'location') {
    return 'Location';
  }
  return 'Quest';
}

const TEXT_LABELS: Record<string, string> = {
  name: 'Name',
  title: 'Title',
  role: 'Role',
  type: 'Type',
  status: 'Status',
  description: 'Description',
  summary: 'Summary',
  public_notes: 'Public Notes',
  secret_notes: 'Private DM Notes',
};

export function EntityFormSheet({
  config,
  defaultValues,
  onSubmit,
  onDelete,
  open,
  onOpenChange,
}: Props) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(defaultValues?.id);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormData({
      ...defaultValues,
      tags: Array.isArray(defaultValues?.tags) ? defaultValues?.tags : [],
      published: Boolean(defaultValues?.published),
    });
  }, [defaultValues, open]);

  const statusOptions = useMemo(() => config.statusOptions ?? [], [config.statusOptions]);

  const updateField = (field: string, value: unknown) => {
    setFormData(current => ({
      ...current,
      [field]: value,
    }));
  };

  const getString = (field: string) => {
    const value = formData[field];
    return typeof value === 'string' ? value : '';
  };

  const getNullableString = (field: string) => {
    const value = getString(field).trim();
    return value.length > 0 ? value : null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const requiredField = config.fields.includes('name') ? 'name' : config.fields.includes('title') ? 'title' : null;
    if (requiredField && !getString(requiredField).trim()) {
      toast.error(`${TEXT_LABELS[requiredField]} is required`);
      return;
    }

    const payload: Record<string, unknown> = {};
    for (const field of config.fields) {
      if (field === 'tags') {
        payload.tags = Array.isArray(formData.tags) ? formData.tags : [];
        continue;
      }

      if (field === 'published') {
        payload.published = Boolean(formData.published);
        continue;
      }

      if (field === 'status') {
        payload.status = getString('status') || statusOptions[0]?.value;
        continue;
      }

      if (field === 'name' || field === 'title') {
        payload[field] = getString(field).trim();
        continue;
      }

      payload[field] = getNullableString(field);
    }

    try {
      setSubmitting(true);
      await onSubmit(payload);
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) {
      return;
    }

    try {
      setSubmitting(true);
      await onDelete();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const entityLabel = titleFromEntityType(config.entityType);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? `Edit ${entityLabel}` : `New ${entityLabel}`}</SheetTitle>
          <SheetDescription>Manage public details and DM-only notes.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {config.fields.includes('name') ? (
            <Input
              label="Name"
              value={getString('name')}
              onChange={event => updateField('name', event.target.value)}
              className="h-12"
              required
              maxLength={100}
            />
          ) : null}

          {config.fields.includes('title') ? (
            <Input
              label="Title"
              value={getString('title')}
              onChange={event => updateField('title', event.target.value)}
              className="h-12"
              required
              maxLength={200}
            />
          ) : null}

          {config.fields.includes('role') ? (
            <Input
              label="Role"
              value={getString('role')}
              onChange={event => updateField('role', event.target.value)}
              className="h-12"
              maxLength={50}
            />
          ) : null}

          {config.fields.includes('type') ? (
            <Input
              label="Type"
              value={getString('type')}
              onChange={event => updateField('type', event.target.value)}
              className="h-12"
              maxLength={50}
            />
          ) : null}

          {config.fields.includes('status') ? (
            <SelectField
              label="Status"
              options={statusOptions.map(option => option.value)}
              optionLabels={Object.fromEntries(statusOptions.map(option => [option.value, option.label]))}
              value={getString('status') || statusOptions[0]?.value}
              onChange={value => updateField('status', value)}
            />
          ) : null}

          {config.fields.includes('description') ? (
            <div className="space-y-2">
              <Label htmlFor="entity-description">Description</Label>
              <Textarea
                id="entity-description"
                value={getString('description')}
                onChange={event => updateField('description', event.target.value)}
                rows={4}
                maxLength={5000}
              />
            </div>
          ) : null}

          {config.fields.includes('summary') ? (
            <div className="space-y-2">
              <Label htmlFor="entity-summary">Summary</Label>
              <Textarea
                id="entity-summary"
                value={getString('summary')}
                onChange={event => updateField('summary', event.target.value)}
                rows={4}
                maxLength={5000}
              />
            </div>
          ) : null}

          {config.fields.includes('tags') ? (
            <div className="space-y-2">
              <Label>Tags</Label>
              <TagInput
                value={Array.isArray(formData.tags) ? (formData.tags as string[]) : []}
                onChange={nextTags => updateField('tags', nextTags)}
              />
            </div>
          ) : null}

          {config.fields.includes('public_notes') ? (
            <div className="space-y-2">
              <Label htmlFor="entity-public-notes">Public Notes</Label>
              <Textarea
                id="entity-public-notes"
                value={getString('public_notes')}
                onChange={event => updateField('public_notes', event.target.value)}
                rows={5}
                maxLength={5000}
              />
            </div>
          ) : null}

          {config.fields.includes('secret_notes') ? (
            <div className="space-y-2">
              <Label htmlFor="entity-secret-notes">Private DM Notes</Label>
              <Textarea
                id="entity-secret-notes"
                value={getString('secret_notes')}
                onChange={event => updateField('secret_notes', event.target.value)}
                rows={5}
                maxLength={5000}
              />
            </div>
          ) : null}

          {config.fields.includes('published') ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2">
              <Switch
                checked={Boolean(formData.published)}
                onCheckedChange={checked => updateField('published', checked)}
              />
              <span className="text-sm text-muted-foreground">Share with players</span>
            </div>
          ) : null}

          <SheetFooter className="pt-2">
            {isEditing && onDelete ? (
              <TrashButton
                onDelete={handleDelete}
                entityName={entityLabel}
                size="sm"
                disabled={submitting}
              />
            ) : null}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Save' : 'Create'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
