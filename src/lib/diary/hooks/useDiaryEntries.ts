'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { DiaryEntryDecrypted, DiaryEntryDraft, DiaryEntryEncryptedRow } from '@/lib/diary/types';
import { useDiaryCrypto } from '@/lib/diary/hooks/useDiaryCrypto';

const AUTOSAVE_MS = 3000;
const AUTOLOCK_INACTIVITY_MS = 15 * 60 * 1000;

type DraftUpdate = Partial<Pick<DiaryEntryDraft, 'title' | 'content' | 'mood' | 'entry_date'>>;
type SaveStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

function sortByDateDesc(entries: DiaryEntryDecrypted[]) {
  return [...entries].sort((a, b) => {
    if (a.entry_date === b.entry_date) {
      return b.created_at.localeCompare(a.created_at);
    }
    return b.entry_date.localeCompare(a.entry_date);
  });
}

function normalizeEntry(row: DiaryEntryEncryptedRow, decoded: { title: string; content: string }) {
  return {
    id: row.id,
    user_id: row.user_id,
    title: decoded.title,
    content: decoded.content,
    mood: row.mood as DiaryEntryDecrypted['mood'],
    tags: row.tags ?? [],
    entry_date: row.entry_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
  } satisfies DiaryEntryDecrypted;
}

function hasMeaningfulContent(entry: Pick<DiaryEntryDecrypted, 'title' | 'content'>) {
  const plainContent = entry.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return Boolean(entry.title.trim() || plainContent);
}

export function useDiaryEntries() {
  const {
    decryptEntry,
    encryptEntry,
    error: cryptoError,
    hasSalt,
    isLoadingKey,
    isLocked,
    isReady,
    isResetting,
    isUnlocking,
    lockDiary,
    resetDiaryEncryption,
    unlockDiary,
  } = useDiaryCrypto();

  const [entries, setEntries] = useState<DiaryEntryDecrypted[]>([]);
  const [persistedEntryIds, setPersistedEntryIds] = useState<Set<string>>(new Set());
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const entriesRef = useRef(entries);
  const persistedIdsRef = useRef(persistedEntryIds);
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    persistedIdsRef.current = persistedEntryIds;
  }, [persistedEntryIds]);

  useEffect(() => {
    if (typeof navigator === 'undefined') {
      return;
    }

    const syncOnline = () => setIsOnline(navigator.onLine);
    syncOnline();
    window.addEventListener('online', syncOnline);
    window.addEventListener('offline', syncOnline);

    return () => {
      window.removeEventListener('online', syncOnline);
      window.removeEventListener('offline', syncOnline);
    };
  }, []);

  useEffect(
    () => () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    },
    [],
  );

  const getCurrentUser = useCallback(async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      setError('Authentication required for diary access');
      return null;
    }

    return session.user;
  }, []);

  const loadEntries = useCallback(async () => {
    if (!isReady) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const user = await getCurrentUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (queryError || !data) {
      setIsLoading(false);
      setError('Failed to load diary entries');
      return;
    }

    try {
      const decryptedResults = await Promise.allSettled(
        data.map(async row => {
          const decoded = await decryptEntry(row);
          return normalizeEntry(row, decoded);
        }),
      );

      const decrypted = decryptedResults
        .filter(
          (result): result is PromiseFulfilledResult<DiaryEntryDecrypted> => result.status === 'fulfilled',
        )
        .map(result => result.value);
      const failedCount = decryptedResults.length - decrypted.length;

      const sortedEntries = sortByDateDesc(decrypted);
      setEntries(sortedEntries);
      setPersistedEntryIds(new Set(sortedEntries.map(entry => entry.id)));
      setSelectedEntryId(current => {
        if (current && sortedEntries.some(entry => entry.id === current)) {
          return current;
        }
        return sortedEntries[0]?.id ?? null;
      });

      if (failedCount > 0) {
        setError(
          failedCount === 1
            ? 'One diary entry could not be decrypted on this session. Re-lock and unlock with your original passphrase.'
            : `${failedCount} diary entries could not be decrypted on this session. Re-lock and unlock with your original passphrase.`,
        );
      }
    } catch {
      setError('Unable to decrypt diary entries on this session');
    } finally {
      setIsLoading(false);
    }
  }, [decryptEntry, getCurrentUser, isReady]);

  const persistEntry = useCallback(
    async (entryId: string) => {
      const entry = entriesRef.current.find(item => item.id === entryId);
      if (!entry || !hasMeaningfulContent(entry)) {
        return;
      }

      if (!isOnline) {
        setSaveStatus('offline');
        return;
      }

      const user = await getCurrentUser();
      if (!user) {
        setSaveStatus('error');
        return;
      }

      setIsSaving(true);
      setSaveStatus('saving');
      setError(null);

      try {
        const encrypted = await encryptEntry(entry.id, entry.title, entry.content);
        const payload = {
          id: entry.id,
          user_id: user.id,
          entry_date: entry.entry_date,
          mood: entry.mood,
          tags: entry.tags,
          ...encrypted,
        };

        const { data: savedRow, error: saveError } = await supabase
          .from('diary_entries')
          .upsert(payload, { onConflict: 'id' })
          .select('*')
          .single();

        if (saveError || !savedRow) {
          throw saveError ?? new Error('Missing saved diary entry');
        }

        const decoded = await decryptEntry(savedRow);
        const persisted = normalizeEntry(savedRow, decoded);

        setEntries(prev => {
          const filtered = prev.filter(item => item.id !== entryId);
          return sortByDateDesc([persisted, ...filtered]);
        });
        setPersistedEntryIds(prev => {
          const next = new Set(prev);
          next.add(entryId);
          return next;
        });
        setSaveStatus('saved');
      } catch {
        setSaveStatus(isOnline ? 'error' : 'offline');
        setError('Failed to save diary entry');
      } finally {
        setIsSaving(false);
      }
    },
    [decryptEntry, encryptEntry, getCurrentUser, isOnline],
  );

  const scheduleAutosave = useCallback(
    (entryId: string) => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      autosaveTimeoutRef.current = setTimeout(() => {
        void persistEntry(entryId);
      }, AUTOSAVE_MS);
    },
    [persistEntry],
  );

  const lockDiarySession = useCallback(() => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
    setSaveStatus('idle');
    lockDiary();
  }, [lockDiary]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const clearInactivityTimer = () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
    };

    if (isLocked) {
      clearInactivityTimer();
      return;
    }

    const resetInactivityTimer = () => {
      clearInactivityTimer();
      inactivityTimeoutRef.current = setTimeout(() => {
        lockDiarySession();
      }, AUTOLOCK_INACTIVITY_MS);
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'scroll',
      'touchstart',
      'mousemove',
    ];

    resetInactivityTimer();
    activityEvents.forEach(eventName => {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    });

    return () => {
      activityEvents.forEach(eventName => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
      clearInactivityTimer();
    };
  }, [isLocked, lockDiarySession]);

  useEffect(() => {
    if (cryptoError) {
      setError(cryptoError);
      setIsLoading(false);
      return;
    }

    if (!isReady) {
      if (!isLoadingKey) {
        setIsLoading(false);
      }
      return;
    }

    void loadEntries();
  }, [cryptoError, isLoadingKey, isReady, loadEntries]);

  const selectEntry = useCallback((entryId: string) => {
    setSelectedEntryId(entryId);
    setSaveStatus('idle');
  }, []);

  const createNewEntry = useCallback(async () => {
    const user = await getCurrentUser();
    if (!user) {
      return;
    }

    const now = new Date().toISOString();
    const newEntry: DiaryEntryDecrypted = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: '',
      content: '',
      mood: null,
      tags: [],
      entry_date: now.slice(0, 10),
      created_at: now,
      updated_at: now,
    };

    setEntries(prev => sortByDateDesc([newEntry, ...prev]));
    setSelectedEntryId(newEntry.id);
    setSaveStatus('idle');
  }, [getCurrentUser]);

  const updateDraft = useCallback(
    (partial: DraftUpdate) => {
      setEntries(prev => {
        if (!selectedEntryId) {
          return prev;
        }

        const nextEntries = prev.map(entry => {
          if (entry.id !== selectedEntryId) {
            return entry;
          }

          return {
            ...entry,
            ...partial,
            updated_at: new Date().toISOString(),
          };
        });

        return sortByDateDesc(nextEntries);
      });

      if (!selectedEntryId) {
        return;
      }

      setSaveStatus(isOnline ? 'idle' : 'offline');
      scheduleAutosave(selectedEntryId);
    },
    [isOnline, scheduleAutosave, selectedEntryId],
  );

  const deleteEntry = useCallback(async (entryId: string) => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }

    const previousEntries = entriesRef.current;
    const previousSelection = selectedEntryId;

    const remainingEntries = previousEntries.filter(entry => entry.id !== entryId);
    setEntries(remainingEntries);
    setSelectedEntryId(current => {
      if (current !== entryId) {
        return current;
      }
      return remainingEntries[0]?.id ?? null;
    });
    setSaveStatus('idle');

    if (!persistedIdsRef.current.has(entryId)) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const { error: deleteError } = await supabase
      .from('diary_entries')
      .delete()
      .eq('id', entryId);

    if (deleteError) {
      setEntries(previousEntries);
      setSelectedEntryId(previousSelection);
      setError('Failed to delete diary entry');
      setSaveStatus('error');
    } else {
      setPersistedEntryIds(prev => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    }

    setIsSaving(false);
  }, [selectedEntryId]);

  const resetDiary = useCallback(async () => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }

    const ok = await resetDiaryEncryption();
    if (!ok) {
      return false;
    }

    setEntries([]);
    setPersistedEntryIds(new Set());
    setSelectedEntryId(null);
    setSaveStatus('idle');
    setError(null);
    return true;
  }, [resetDiaryEncryption]);

  const selectedEntry = useMemo(
    () => entries.find(entry => entry.id === selectedEntryId) ?? null,
    [entries, selectedEntryId],
  );

  return useMemo(
    () => ({
      entries,
      selectedEntry,
      selectedEntryId,
      error,
      hasSalt,
      isLoading: isLoading || isLoadingKey,
      isLocked,
      isOnline,
      isSaving,
      isResetting,
      isUnlocking,
      saveStatus: isOnline ? saveStatus : 'offline',
      loadEntries,
      lockDiary: lockDiarySession,
      selectEntry,
      createNewEntry,
      updateDraft,
      deleteEntry,
      resetDiary,
      unlockDiary,
    }),
    [
      createNewEntry,
      deleteEntry,
      entries,
      error,
      hasSalt,
      isLoading,
      isLoadingKey,
      isLocked,
      isOnline,
      isSaving,
      isResetting,
      isUnlocking,
      loadEntries,
      lockDiarySession,
      resetDiary,
      saveStatus,
      selectEntry,
      selectedEntry,
      selectedEntryId,
      unlockDiary,
      updateDraft,
    ],
  );
}
