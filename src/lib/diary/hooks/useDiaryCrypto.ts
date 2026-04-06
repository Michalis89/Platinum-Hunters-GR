'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  decryptDiaryField,
  deriveDiaryKeyFromPassphrase,
  encryptDiaryField,
  generateDiarySalt,
} from '@/lib/diary/crypto';
import { supabase } from '@/lib/supabase-client';
import type { DiaryEntryEncryptedRow } from '@/lib/diary/types';

type EncryptedDiaryPayload = {
  title_encrypted: string;
  title_iv: string;
  content_encrypted: string;
  iv: string;
};

type SaltState = {
  userId: string | null;
  saltB64: string | null;
  hasSalt: boolean;
};

function buildAad(userId: string, entryId: string, field: 'title' | 'content') {
  return `${userId}:${entryId}:${field}`;
}

async function decryptFieldWithFallback(
  key: CryptoKey,
  entry: Pick<
    DiaryEntryEncryptedRow,
    'id' | 'user_id' | 'title_encrypted' | 'title_iv' | 'content_encrypted' | 'iv'
  > & {
    title?: string | null;
    content?: string | null;
  },
  field: 'title' | 'content',
) {
  const cipherTextB64 = field === 'title' ? entry.title_encrypted : entry.content_encrypted;
  const ivB64 = field === 'title' ? entry.title_iv : entry.iv;
  const plaintextFallback = field === 'title' ? entry.title : entry.content;

  try {
    return await decryptDiaryField(
      cipherTextB64,
      ivB64,
      key,
      buildAad(entry.user_id, entry.id, field),
    );
  } catch {
    try {
      // Legacy compatibility: older rows may have been encrypted without AAD.
      return await decryptDiaryField(cipherTextB64, ivB64, key);
    } catch {
      if (typeof plaintextFallback === 'string') {
        return plaintextFallback;
      }
      throw new Error(`Unable to decrypt diary ${field}`);
    }
  }
}

export function useDiaryCrypto() {
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [saltState, setSaltState] = useState<SaltState>({
    userId: null,
    saltB64: null,
    hasSalt: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const loadSaltState = useCallback(async () => {
    setIsLoadingKey(true);
    setError(null);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      setSaltState({ userId: null, saltB64: null, hasSalt: false });
      setCryptoKey(null);
      setIsLoadingKey(false);
      setError('Authentication required for diary access');
      return;
    }

    const { data: saltRow, error: saltError } = await supabase
      .from('diary_key_salts')
      .select('salt')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (saltError) {
      setIsLoadingKey(false);
      setError('Unable to access diary key metadata');
      return;
    }

    setSaltState({
      userId: session.user.id,
      saltB64: saltRow?.salt ?? null,
      hasSalt: Boolean(saltRow?.salt),
    });
    setCryptoKey(null);
    setIsLoadingKey(false);
  }, []);

  useEffect(() => {
    void loadSaltState();
  }, [loadSaltState]);

  const ensureSalt = useCallback(async () => {
    if (!saltState.userId) {
      throw new Error('Authentication required for diary access');
    }

    if (saltState.saltB64) {
      return saltState.saltB64;
    }

    const generatedSalt = generateDiarySalt();
    const { error: upsertError } = await supabase
      .from('diary_key_salts')
      .upsert(
        { user_id: saltState.userId, salt: generatedSalt },
        { onConflict: 'user_id', ignoreDuplicates: true },
      );

    if (upsertError) {
      throw new Error('Unable to initialize diary key metadata');
    }

    const { data: saltRow, error: fetchError } = await supabase
      .from('diary_key_salts')
      .select('salt')
      .eq('user_id', saltState.userId)
      .maybeSingle();

    if (fetchError || !saltRow?.salt) {
      throw new Error('Unable to initialize diary key metadata');
    }

    const resolvedSalt = saltRow.salt;

    setSaltState(current => ({
      ...current,
      saltB64: resolvedSalt,
      hasSalt: true,
    }));

    return resolvedSalt;
  }, [saltState.saltB64, saltState.userId]);

  const unlockDiary = useCallback(
    async (passphrase: string) => {
      if (!passphrase.trim()) {
        setError('Passphrase is required to unlock diary');
        return false;
      }

      setIsUnlocking(true);
      setError(null);

      try {
        const saltB64 = await ensureSalt();
        const key = await deriveDiaryKeyFromPassphrase(passphrase, saltB64);

        // Validate passphrase against an existing encrypted row before unlocking.
        // This avoids mixed-key sessions caused by passphrase typos.
        if (saltState.userId) {
          const { data: sampleEncryptedEntries, error: sampleError } = await supabase
            .from('diary_entries')
            .select('id,user_id,title_encrypted,title_iv,content_encrypted,iv')
            .eq('user_id', saltState.userId)
            .not('title_encrypted', 'is', null)
            .not('title_iv', 'is', null)
            .not('content_encrypted', 'is', null)
            .not('iv', 'is', null)
            .order('updated_at', { ascending: false })
            .limit(5);

          if (sampleError) {
            throw sampleError;
          }

          if (sampleEncryptedEntries && sampleEncryptedEntries.length > 0) {
            let hasValidDecrypt = false;
            for (const sampleEncryptedEntry of sampleEncryptedEntries) {
              try {
                await Promise.all([
                  decryptFieldWithFallback(key, sampleEncryptedEntry, 'title'),
                  decryptFieldWithFallback(key, sampleEncryptedEntry, 'content'),
                ]);
                hasValidDecrypt = true;
                break;
              } catch {
                // Try next candidate; one bad row should not invalidate the passphrase.
              }
            }

            if (!hasValidDecrypt) {
              throw new Error('Unable to validate diary key with existing encrypted entries');
            }
          }
        }

        setCryptoKey(key);
        return true;
      } catch {
        setCryptoKey(null);
        setError('Unable to unlock diary with this passphrase');
        return false;
      } finally {
        setIsUnlocking(false);
      }
    },
    [ensureSalt, saltState.userId],
  );

  const lockDiary = useCallback(() => {
    setCryptoKey(null);
  }, []);

  const resetDiaryEncryption = useCallback(async () => {
    setIsResetting(true);
    setError(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setError('Authentication required for diary access');
        return false;
      }

      const userId = session.user.id;

      const { error: deleteEntriesError } = await supabase
        .from('diary_entries')
        .delete()
        .eq('user_id', userId);

      if (deleteEntriesError) {
        throw deleteEntriesError;
      }

      const { error: deleteSaltError } = await supabase
        .from('diary_key_salts')
        .delete()
        .eq('user_id', userId);

      if (deleteSaltError) {
        throw deleteSaltError;
      }

      setCryptoKey(null);
      setSaltState({
        userId,
        saltB64: null,
        hasSalt: false,
      });

      return true;
    } catch {
      setError('Unable to reset diary encryption');
      return false;
    } finally {
      setIsResetting(false);
    }
  }, []);

  const encryptEntry = useCallback(
    async (entryId: string, title: string, content: string): Promise<EncryptedDiaryPayload> => {
      if (!cryptoKey || !saltState.userId) {
        throw new Error('Diary is locked');
      }

      const [encryptedTitle, encryptedContent] = await Promise.all([
        encryptDiaryField(title, cryptoKey, buildAad(saltState.userId, entryId, 'title')),
        encryptDiaryField(content, cryptoKey, buildAad(saltState.userId, entryId, 'content')),
      ]);

      return {
        title_encrypted: encryptedTitle.cipherTextB64,
        title_iv: encryptedTitle.ivB64,
        content_encrypted: encryptedContent.cipherTextB64,
        iv: encryptedContent.ivB64,
      };
    },
    [cryptoKey, saltState.userId],
  );

  const decryptEntry = useCallback(
    async (
      entry: Pick<
        DiaryEntryEncryptedRow,
        'id' | 'user_id' | 'title_encrypted' | 'title_iv' | 'content_encrypted' | 'iv'
      > & {
        title?: string | null;
        content?: string | null;
      },
    ) => {
      if (!cryptoKey) {
        throw new Error('Diary is locked');
      }

      const [title, content] = await Promise.all([
        decryptFieldWithFallback(cryptoKey, entry, 'title'),
        decryptFieldWithFallback(cryptoKey, entry, 'content'),
      ]);

      return { title, content };
    },
    [cryptoKey],
  );

  return useMemo(
    () => ({
      cryptoKey,
      error,
      hasSalt: saltState.hasSalt,
      isLoadingKey,
      isLocked: !cryptoKey,
      isReady: Boolean(cryptoKey) && !isLoadingKey,
      isResetting,
      isUnlocking,
      userId: saltState.userId,
      lockDiary,
      loadSaltState,
      unlockDiary,
      resetDiaryEncryption,
      encryptEntry,
      decryptEntry,
    }),
    [
      cryptoKey,
      decryptEntry,
      encryptEntry,
      error,
      isLoadingKey,
      isResetting,
      isUnlocking,
      loadSaltState,
      lockDiary,
      resetDiaryEncryption,
      saltState.hasSalt,
      saltState.userId,
      unlockDiary,
    ],
  );
}
