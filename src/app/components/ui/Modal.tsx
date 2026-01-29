import { ReactNode, useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: Readonly<ModalProps>) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (isOpen && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog?.open) {
      dialog.close();
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <div
      onClick={e => {
        const dialog = dialogRef.current;
        if (dialog && e.target === dialog) {
          onClose();
        }
      }}
      onKeyDown={e => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      tabIndex={-1}
    >
      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-surface)] p-6 shadow-[var(--hb-shadow-md)] backdrop-blur-sm"
        aria-labelledby="modal-title"
      >
        {title && (
          <h3 id="modal-title" className="mb-4 text-xl font-semibold text-[var(--hb-headline)]">
            {title}
          </h3>
        )}
        <div className="text-[var(--hb-text)]">{children}</div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm text-[var(--hb-muted)] transition hover:text-[var(--hb-headline)]"
          ></button>
        </div>
      </dialog>
    </div>
  );
}
