import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiaryEditor from '@/app/components/diary/DiaryEditor.client';
import type { DiaryEntryDecrypted, DiaryEntryDraft } from '@/lib/diary/types';

const baseEntry: DiaryEntryDraft = {
  id: 'entry-1',
  title: 'Morning',
  content: 'Initial notes',
  mood: null,
  entry_date: '2026-02-20',
  tags: [],
};

function createSavedEntry(draft: DiaryEntryDraft): DiaryEntryDecrypted {
  return {
    id: draft.id ?? 'entry-1',
    user_id: 'user-1',
    title: draft.title,
    content: draft.content,
    mood: draft.mood,
    tags: draft.tags ?? [],
    entry_date: draft.entry_date,
    created_at: '2026-02-20T10:00:00.000Z',
    updated_at: '2026-02-20T10:00:00.000Z',
  };
}

describe('DiaryEditor autosave', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces autosave by 3000ms', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onSave = jest.fn(async draft => createSavedEntry(draft));

    render(
      <DiaryEditor
        entry={baseEntry}
        isSaving={false}
        onCreateEntry={jest.fn()}
        onDelete={jest.fn(async () => {})}
        onSave={onSave}
      />,
    );

    const area = screen.getByPlaceholderText(
      'Write freely. Your words stay encrypted before they ever leave this browser.',
    );
    await user.clear(area);
    await user.type(area, 'Updated diary line');

    act(() => {
      jest.advanceTimersByTime(2900);
    });
    expect(onSave).toHaveBeenCalledTimes(0);

    await act(async () => {
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('coalesces rapid edits into one autosave call', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onSave = jest.fn(async draft => createSavedEntry(draft));

    render(
      <DiaryEditor
        entry={baseEntry}
        isSaving={false}
        onCreateEntry={jest.fn()}
        onDelete={jest.fn(async () => {})}
        onSave={onSave}
      />,
    );

    const titleInput = screen.getByPlaceholderText('Untitled reflection');
    await user.clear(titleInput);
    await user.type(titleInput, 'A');
    act(() => {
      jest.advanceTimersByTime(700);
    });
    await user.type(titleInput, ' calm day');
    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
