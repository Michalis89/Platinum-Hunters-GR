'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

type HandoutFormValues = {
  title: string;
  content: string;
  published: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: HandoutFormValues;
  onSubmit: (values: HandoutFormValues) => Promise<void>;
};

export function HandoutFormSheet({ open, onOpenChange, defaultValues, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(defaultValues?.title ?? '');
    setContent(defaultValues?.content ?? '');
    setPublished(defaultValues?.published ?? false);
  }, [defaultValues, open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        content,
        published,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{defaultValues ? 'Edit Handout' : 'New Handout'}</SheetTitle>
          <SheetDescription>Create player-facing lore and references.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={event => setTitle(event.target.value)}
            maxLength={200}
            className="h-12"
            required
          />

          <div className="space-y-2">
            <Label htmlFor="handout-content">Content</Label>
            <Textarea
              id="handout-content"
              value={content}
              onChange={event => setContent(event.target.value)}
              rows={14}
              maxLength={20000}
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2">
            <Switch checked={published} onCheckedChange={setPublished} />
            <span className="text-sm text-muted-foreground">Share with players</span>
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting ? 'Saving...' : 'Save Handout'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
