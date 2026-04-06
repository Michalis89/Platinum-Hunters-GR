'use client';

import { useCallback, useEffect, useState } from 'react';
import { DiaryEntryListPane } from '@/app/components/diary/DiaryEntryListPane';
import { DiaryEditorPane } from '@/app/components/diary/DiaryEditorPane';
import type { DiaryEntryDecrypted, DiaryEntryDraft } from '@/lib/diary/types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

type DiarySplitViewProps = {
  entries: DiaryEntryDecrypted[];
  selectedEntry: DiaryEntryDecrypted | null;
  selectedEntryId: string | null;
  saveStatus: SaveStatus;
  isSaving: boolean;
  hasOfflineDraftForSelected?: boolean;
  onSyncOfflineDrafts?: () => Promise<number>;
  onSelectEntry: (entryId: string) => void;
  onCreateNew: () => void;
  onUpdateDraft: (
    partial: Partial<Pick<DiaryEntryDraft, 'title' | 'content' | 'mood' | 'entry_date'>>,
  ) => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
};

export function DiarySplitView({
  entries,
  selectedEntry,
  selectedEntryId,
  saveStatus,
  isSaving,
  hasOfflineDraftForSelected = false,
  onSyncOfflineDrafts,
  onSelectEntry,
  onCreateNew,
  onUpdateDraft,
  onDeleteEntry,
}: DiarySplitViewProps) {
  const [searchValue, setSearchValue] = useState('');
  const [mobileMode, setMobileMode] = useState<'list' | 'editor'>('list');
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mediaQuery.matches);
    update();

    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  const effectiveMobileMode: 'list' | 'editor' = isDesktop ? 'list' : mobileMode;

  const handleSelectEntry = useCallback(
    (entryId: string) => {
      onSelectEntry(entryId);
      if (!isDesktop) {
        setMobileMode('editor');
      }
    },
    [isDesktop, onSelectEntry],
  );

  const handleCreateEntry = useCallback(() => {
    onCreateNew();
    if (!isDesktop) {
      setMobileMode('editor');
    }
  }, [isDesktop, onCreateNew]);

  return (
    <section className="grid h-full min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[390px_minmax(0,1fr)] lg:gap-5">
      <aside
        className={[
          'min-h-0 lg:h-full lg:overflow-y-auto',
          !isDesktop && effectiveMobileMode === 'editor' ? 'hidden' : 'block',
        ].join(' ')}
      >
        <DiaryEntryListPane
          entries={entries}
          searchValue={searchValue}
          selectedEntryId={selectedEntryId}
          onSearchChange={setSearchValue}
          onSelectEntry={handleSelectEntry}
          onCreateNew={handleCreateEntry}
        />
      </aside>

      <div className="hidden min-h-0 lg:block lg:h-full">
        <DiaryEditorPane
          entry={selectedEntry}
          saveStatus={saveStatus}
          isSaving={isSaving}
          hasOfflineDraft={hasOfflineDraftForSelected}
          onSyncOfflineDrafts={onSyncOfflineDrafts}
          onDelete={onDeleteEntry}
          onUpdateDraft={onUpdateDraft}
        />
      </div>

      {!isDesktop && effectiveMobileMode === 'editor' ? (
        <div className="fixed inset-0 top-16 z-40 overflow-y-auto bg-[hsl(var(--surface-base))] px-3 pb-6 pt-3 sm:px-4 sm:pb-8 sm:pt-4">
          <DiaryEditorPane
            entry={selectedEntry}
            saveStatus={saveStatus}
            isSaving={isSaving}
            hasOfflineDraft={hasOfflineDraftForSelected}
            onSyncOfflineDrafts={onSyncOfflineDrafts}
            showBackButton
            onBack={() => setMobileMode('list')}
            onDelete={onDeleteEntry}
            onUpdateDraft={onUpdateDraft}
          />
        </div>
      ) : null}
    </section>
  );
}
