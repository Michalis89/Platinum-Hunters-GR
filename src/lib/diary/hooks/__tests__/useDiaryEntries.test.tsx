import { renderHook, waitFor } from '@testing-library/react';

jest.mock('@/lib/diary/hooks/useDiaryCrypto', () => ({
  useDiaryCrypto: jest.fn(),
}));

jest.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

import { useDiaryCrypto } from '@/lib/diary/hooks/useDiaryCrypto';
import { supabase } from '@/lib/supabase-client';
import { useDiaryEntries } from '@/lib/diary/hooks/useDiaryEntries';

describe('useDiaryEntries', () => {
  it('loads encrypted rows and decrypts them client-side', async () => {
    const decryptEntry = jest.fn(async () => ({
      title: 'Encrypted title',
      content: 'Encrypted content',
    }));

    (useDiaryCrypto as jest.Mock).mockReturnValue({
      decryptEntry,
      encryptEntry: jest.fn(),
      error: null,
      hasSalt: true,
      isLoadingKey: false,
      isLocked: false,
      isReady: true,
      isUnlocking: false,
      lockDiary: jest.fn(),
      unlockDiary: jest.fn(),
    });

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const finalOrder = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'entry-1',
          user_id: 'user-1',
          title_encrypted: 'cipher-title',
          title_iv: 'iv-title',
          content_encrypted: 'cipher-content',
          iv: 'iv-content',
          mood: 'calm',
          tags: [],
          entry_date: '2026-02-20',
          created_at: '2026-02-20T10:00:00.000Z',
          updated_at: '2026-02-20T10:00:00.000Z',
        },
      ],
      error: null,
    });
    const firstOrder = jest.fn().mockReturnValue({ order: finalOrder });
    const eq = jest.fn().mockReturnValue({ order: firstOrder });
    const select = jest.fn().mockReturnValue({ eq });

    (supabase.from as jest.Mock).mockReturnValue({
      select,
      delete: jest.fn(),
      update: jest.fn(),
      insert: jest.fn(),
    });

    const { result } = renderHook(() => useDiaryEntries());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].title).toBe('Encrypted title');
    expect(result.current.entries[0].content).toBe('Encrypted content');
    expect(decryptEntry).toHaveBeenCalledTimes(1);
  });
});
