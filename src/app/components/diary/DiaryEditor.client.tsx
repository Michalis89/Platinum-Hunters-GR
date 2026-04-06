'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MoodPills } from '@/app/components/diary/MoodPills';
import type { DiaryEntryDecrypted, DiaryEntryDraft, DiaryMood } from '@/lib/diary/types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type DiaryEditableEntry = Pick<DiaryEntryDraft, 'id' | 'title' | 'content' | 'mood' | 'entry_date'>;

type DiaryEditorProps = {
  entry: DiaryEditableEntry | null;
  isSaving: boolean;
  onCreateEntry: () => void;
  onDelete: (entryId: string) => Promise<void>;
  onSave: (draft: DiaryEntryDraft) => Promise<DiaryEntryDecrypted | null>;
};

const AUTOSAVE_MS = 3000;

function snapshotValue(input: {
  id?: string;
  title: string;
  content: string;
  mood: DiaryMood | null;
  entryDate: string;
}) {
  return JSON.stringify({
    id: input.id ?? null,
    title: input.title,
    content: input.content,
    mood: input.mood,
    entryDate: input.entryDate,
  });
}

export default function DiaryEditor({
  entry,
  isSaving,
  onCreateEntry,
  onDelete,
  onSave,
}: DiaryEditorProps) {
  const [entryId, setEntryId] = useState<string | undefined>(entry?.id);
  const [title, setTitle] = useState(entry?.title ?? '');
  const [content, setContent] = useState(entry?.content ?? '');
  const [mood, setMood] = useState<DiaryMood | null>(entry?.mood ?? null);
  const [entryDate, setEntryDate] = useState(
    entry?.entry_date ?? new Date().toISOString().slice(0, 10),
  );
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const persistInFlightRef = useRef(false);

  const lastSavedSnapshotRef = useRef(
    snapshotValue({
      id: entry?.id,
      title: entry?.title ?? '',
      content: entry?.content ?? '',
      mood: entry?.mood ?? null,
      entryDate: entry?.entry_date ?? new Date().toISOString().slice(0, 10),
    }),
  );

  useEffect(() => {
    setEntryId(entry?.id);
    setTitle(entry?.title ?? '');
    setContent(entry?.content ?? '');
    setMood(entry?.mood ?? null);
    setEntryDate(entry?.entry_date ?? new Date().toISOString().slice(0, 10));
    const snapshot = snapshotValue({
      id: entry?.id,
      title: entry?.title ?? '',
      content: entry?.content ?? '',
      mood: entry?.mood ?? null,
      entryDate: entry?.entry_date ?? new Date().toISOString().slice(0, 10),
    });
    lastSavedSnapshotRef.current = snapshot;
    setSaveState('idle');
  }, [entry]);

  const currentSnapshot = useMemo(
    () =>
      snapshotValue({
        id: entryId,
        title,
        content,
        mood,
        entryDate,
      }),
    [content, entryDate, entryId, mood, title],
  );

  const isDirty = currentSnapshot !== lastSavedSnapshotRef.current;

  const persist = useCallback(async () => {
    if (persistInFlightRef.current) {
      return;
    }

    if (!isDirty) {
      return;
    }

    if (!title.trim() && !content.trim()) {
      return;
    }

    persistInFlightRef.current = true;
    setSaveState('saving');

    try {
      const saved = await onSave({
        id: entryId,
        title,
        content,
        mood,
        entry_date: entryDate,
        tags: [],
      });

      if (!saved) {
        setSaveState('error');
        return;
      }

      setEntryId(saved.id);
      setTitle(saved.title);
      setContent(saved.content);
      setMood(saved.mood);
      setEntryDate(saved.entry_date);

      const savedSnapshot = snapshotValue({
        id: saved.id,
        title: saved.title,
        content: saved.content,
        mood: saved.mood,
        entryDate: saved.entry_date,
      });
      lastSavedSnapshotRef.current = savedSnapshot;
      setSaveState('saved');
    } finally {
      persistInFlightRef.current = false;
    }
  }, [content, entryDate, entryId, isDirty, mood, onSave, title]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void persist();
    }, AUTOSAVE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isDirty, persist]);

  if (!entry) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-8 text-center">
        <p className="text-2xl font-medium leading-8 text-foreground">
          A page for your inner weather.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Start with a single thought and let it unfold.
        </p>
        <Button className="mt-6" variant="secondary" onClick={onCreateEntry}>
          New entry
        </Button>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-border/80 bg-card/80 p-5 duration-200 animate-in md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Private draft</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-muted-foreground"
            onClick={() => void persist()}
            disabled={isSaving}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save
          </Button>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-muted-foreground hover:text-destructive"
                disabled={isSaving || !entryId}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this diary entry?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The encrypted entry will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={isSaving || !entryId}
                  onClick={() => {
                    if (!entryId) {
                      return;
                    }
                    void onDelete(entryId);
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {saveState === 'saving' || isSaving ? (
        <Alert variant="info" className="mb-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Saving</AlertTitle>
          <AlertDescription>Encrypting and storing your entry securely.</AlertDescription>
        </Alert>
      ) : null}

      {saveState === 'saved' ? (
        <Alert variant="success" className="mb-4">
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>Your encrypted diary entry is up to date.</AlertDescription>
        </Alert>
      ) : null}

      {saveState === 'error' ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Save failed</AlertTitle>
          <AlertDescription>
            Unable to save this entry right now. Please try again.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-4">
        <Input
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="Untitled reflection"
          className="h-12 border-none bg-transparent px-0 text-2xl font-medium leading-8 shadow-none focus-visible:ring-0"
          maxLength={180}
        />

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Mood</label>
          <MoodPills value={mood} onChange={setMood} disabled={isSaving} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="entry-date"
            className="text-xs uppercase tracking-wide text-muted-foreground"
          >
            Date
          </label>
          <Input
            id="entry-date"
            type="date"
            value={entryDate}
            onChange={event => setEntryDate(event.target.value)}
            className="h-9 w-[180px] text-sm"
          />
        </div>

        <Textarea
          value={content}
          onChange={event => setContent(event.target.value)}
          placeholder="Write freely. Your words stay encrypted before they ever leave this browser."
          className="min-h-[320px] resize-y border-none bg-transparent px-0 text-[17px] leading-8 shadow-none focus-visible:ring-0"
        />
      </div>
    </section>
  );
}
