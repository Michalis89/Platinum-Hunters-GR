'use client';

import { useState, type FormEvent } from 'react';
import type { CreateCampaignInput } from '@/lib/dnd/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  onSubmit: (data: CreateCampaignInput) => Promise<void>;
  defaultValues?: Partial<CreateCampaignInput>;
  submitLabel?: string;
};

export function CampaignForm({ onSubmit, defaultValues, submitLabel = 'Create Campaign' }: Props) {
  const [name, setName] = useState(defaultValues?.name ?? '');
  const [system, setSystem] = useState(defaultValues?.system ?? '');
  const [description, setDescription] = useState(defaultValues?.description ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Campaign name is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit({
        name: trimmedName,
        system: system.trim() ? system.trim() : null,
        description: description.trim() ? description.trim() : null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save campaign.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to save campaign</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="campaign-name">Name</Label>
        <Input
          id="campaign-name"
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="The Ember Crown"
          required
          disabled={submitting}
          maxLength={100}
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign-system">System</Label>
        <Input
          id="campaign-system"
          value={system}
          onChange={event => setSystem(event.target.value)}
          placeholder="D&D 5e 2024"
          disabled={submitting}
          maxLength={50}
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign-description">Description</Label>
        <Textarea
          id="campaign-description"
          value={description}
          onChange={event => setDescription(event.target.value)}
          placeholder="A fractured kingdom, two rival guilds, and a dragon cult in the shadows..."
          disabled={submitting}
          maxLength={500}
          rows={5}
        />
      </div>

      <Button type="submit" disabled={submitting || name.trim().length === 0} className="w-full sm:w-auto">
        {submitting ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}
