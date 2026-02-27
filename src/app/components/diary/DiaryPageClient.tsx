'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NotebookPen } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DiarySplitView } from '@/app/components/diary/DiarySplitView';
import { DiaryUnlockDialog } from '@/app/components/diary/DiaryUnlockDialog';
import { useDiaryEntries } from '@/lib/diary/hooks/useDiaryEntries';
import { useUserSettings } from '@/lib/settings/useUserSettings';
import { selectUser } from '@/store/slices/authSlice';

export function DiaryPageClient() {
  const user = useSelector(selectUser);
  const [isUnlockDialogOpen, setUnlockDialogOpen] = useState(true);
  const {
    entries,
    selectedEntry,
    selectedEntryId,
    error,
    hasSalt,
    isLoading,
    isLocked,
    isResetting,
    isSaving,
    isUnlocking,
    saveStatus,
    hasOfflineDraftForSelected,
    syncOfflineDrafts,
    lockDiary,
    selectEntry,
    createNewEntry,
    updateDraft,
    deleteEntry,
    resetDiary,
    unlockDiary,
  } = useDiaryEntries();

  const { settings, isLoading: isLoadingSettings } = useUserSettings(true);

  useEffect(() => {
    if (isLocked) {
      setUnlockDialogOpen(true);
      return;
    }
    setUnlockDialogOpen(false);
  }, [isLocked]);

  return (
    <main className="diary-route-root relative flex min-h-screen flex-col px-3 pb-6 pt-12 text-foreground sm:px-4 sm:pb-8 sm:pt-16">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(to_top,hsl(var(--accent-primary)/0.08),transparent)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-screen-2xl min-h-0 flex-1 flex-col gap-3 sm:gap-4">
        <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-4 sm:p-6">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.28),transparent_70%)]" />
            <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.18),transparent_70%)]" />
          </div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary sm:h-20 sm:w-20">
                <NotebookPen className="h-8 w-8" />
              </div>
              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground sm:text-xs">
                  {user?.username ? `${user.username.toUpperCase()} - ` : ''}
                  DIARY
                </p>
                <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                  Personal Diary
                </h1>
                <p className="text-sm text-muted-foreground sm:text-base">Private. Encrypted.</p>
              </div>
            </div>
            {!isLocked ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={lockDiary}
                className="h-11 self-start rounded-xl border border-border/60 bg-card/60 px-5 text-muted-foreground hover:bg-[hsl(var(--surface-hover)/0.76)] hover:text-foreground lg:self-auto"
              >
                Lock
              </Button>
            ) : settings?.diary_enabled ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUnlockDialogOpen(true)}
                className="h-11 self-start rounded-xl border border-border/60 bg-card/60 px-5 text-muted-foreground hover:bg-[hsl(var(--surface-hover)/0.76)] hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 lg:self-auto"
              >
                Unlock diary
              </Button>
            ) : null}
          </div>
        </section>

        {isLoadingSettings ? (
          <Skeleton className="h-20 w-full rounded-[var(--radius-xl)] border border-[hsl(var(--border-subtle)/0.6)] bg-[hsl(var(--surface-raised)/0.55)]" />
        ) : null}

        {!isLoadingSettings && settings && !settings.diary_enabled ? (
          <Alert>
            <AlertTitle>Diary feature is currently disabled</AlertTitle>
            <AlertDescription className="mt-2">
              Enable Personal Diary in settings to access your encrypted journal.
            </AlertDescription>
            <Button asChild className="mt-4 w-fit" variant="secondary" size="sm">
              <Link href="/settings">Open settings</Link>
            </Button>
          </Alert>
        ) : null}

        {settings?.diary_enabled && error ? (
          <Alert variant="destructive">
            <AlertTitle>Diary unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {settings?.diary_enabled && !isLocked && isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-[var(--radius-xl)] border border-[hsl(var(--border-subtle)/0.6)] bg-[hsl(var(--surface-raised)/0.55)]" />
            <Skeleton className="h-32 w-full rounded-[var(--radius-xl)] border border-[hsl(var(--border-subtle)/0.6)] bg-[hsl(var(--surface-raised)/0.55)]" />
            <Skeleton className="h-32 w-full rounded-[var(--radius-xl)] border border-[hsl(var(--border-subtle)/0.6)] bg-[hsl(var(--surface-raised)/0.55)]" />
          </div>
        ) : null}

        <div className="mt-6 flex min-h-0 flex-1 flex-col sm:mt-7">
          {settings?.diary_enabled && !isLocked && !isLoading ? (
            <DiarySplitView
              entries={entries}
              selectedEntry={selectedEntry}
              selectedEntryId={selectedEntryId}
              saveStatus={saveStatus}
              isSaving={isSaving}
              hasOfflineDraftForSelected={hasOfflineDraftForSelected}
              onSyncOfflineDrafts={syncOfflineDrafts}
              onSelectEntry={selectEntry}
              onCreateNew={() => {
                void createNewEntry();
              }}
              onUpdateDraft={updateDraft}
              onDeleteEntry={deleteEntry}
            />
          ) : null}
        </div>

        {settings?.diary_enabled ? (
          <DiaryUnlockDialog
            hasSalt={hasSalt}
            isInitializing={isLocked && isLoading}
            isOpen={isLocked && isUnlockDialogOpen}
            isResetting={isResetting}
            isUnlocking={isUnlocking}
            onDismiss={() => setUnlockDialogOpen(false)}
            onResetEncryption={resetDiary}
            onUnlock={unlockDiary}
          />
        ) : null}
      </div>
    </main>
  );
}
