import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import DiaryEditor from '@/app/components/diary/DiaryEditor.client';
import type { DiaryEntryDecrypted, DiaryEntryDraft } from '@/lib/diary/types';

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  AlertDialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AlertDialogCancel: ({
    children,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  AlertDialogAction: ({
    children,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

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

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });

  return { promise, resolve };
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

  it('renders empty-state CTA when entry is null and triggers onCreateEntry', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onCreateEntry = jest.fn();

    render(
      <DiaryEditor
        entry={null}
        isSaving={false}
        onCreateEntry={onCreateEntry}
        onDelete={jest.fn(async () => {})}
        onSave={jest.fn(async draft => createSavedEntry(draft))}
      />,
    );

    expect(screen.getByText('A page for your inner weather.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'New entry' }));
    expect(onCreateEntry).toHaveBeenCalledTimes(1);
  });

  it('does not call onSave when clicking Save without changes (not dirty)', async () => {
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

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(0);
  });

  it('does not call onSave for dirty draft when both title and content are empty', async () => {
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

    await user.clear(screen.getByPlaceholderText('Untitled reflection'));
    await user.clear(
      screen.getByPlaceholderText(
        'Write freely. Your words stay encrypted before they ever leave this browser.',
      ),
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(0);
  });

  it('shows error alert when onSave returns null', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onSave = jest.fn(async () => null);

    render(
      <DiaryEditor
        entry={baseEntry}
        isSaving={false}
        onCreateEntry={jest.fn()}
        onDelete={jest.fn(async () => {})}
        onSave={onSave}
      />,
    );

    await user.type(screen.getByPlaceholderText('Untitled reflection'), ' updated');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Save failed')).toBeInTheDocument();
  });

  it('shows external saving alert when isSaving prop is true', () => {
    render(
      <DiaryEditor
        entry={baseEntry}
        isSaving
        onCreateEntry={jest.fn()}
        onDelete={jest.fn(async () => {})}
        onSave={jest.fn(async draft => createSavedEntry(draft))}
      />,
    );

    expect(screen.getByText('Saving')).toBeInTheDocument();
    expect(screen.getByText('Encrypting and storing your entry securely.')).toBeInTheDocument();
  });

  it('handles delete confirm both without and with entryId', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onDelete = jest.fn(async () => {});

    const { rerender } = render(
      <DiaryEditor
        entry={{ ...baseEntry, id: undefined }}
        isSaving={false}
        onCreateEntry={jest.fn()}
        onDelete={onDelete}
        onSave={jest.fn(async draft => createSavedEntry(draft))}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    expect(onDelete).toHaveBeenCalledTimes(0);

    rerender(
      <DiaryEditor
        entry={baseEntry}
        isSaving={false}
        onCreateEntry={jest.fn()}
        onDelete={onDelete}
        onSave={jest.fn(async draft => createSavedEntry(draft))}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('entry-1');
  });

  it('prevents concurrent persist calls while save is in-flight', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const deferred = createDeferred<DiaryEntryDecrypted | null>();
    const onSave = jest.fn(() => deferred.promise);

    render(
      <DiaryEditor
        entry={baseEntry}
        isSaving={false}
        onCreateEntry={jest.fn()}
        onDelete={jest.fn(async () => {})}
        onSave={onSave}
      />,
    );

    await user.type(screen.getByPlaceholderText('Untitled reflection'), ' updated');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledTimes(1);

    deferred.resolve(
      createSavedEntry({
        ...baseEntry,
        title: 'Morning updated',
      }),
    );
    await act(async () => {
      await Promise.resolve();
    });
  });
});
