'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Image as ImageIcon, FileText, UploadCloud, X } from 'lucide-react';
import { cn } from '@/utils/utils';
import FormErrorMessage from '@/app/components/ui/FormErrorMessage';

export type AttachmentItem = {
  id: string;
  file: File;
  previewUrl?: string;
};

interface AttachmentDropzoneProps {
  items: AttachmentItem[];
  onChange: (items: AttachmentItem[]) => void;
  maxFiles?: number;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

const buildItems = (files: File[]) =>
  files.map(file => ({
    id: `${file.name}-${file.size}-${file.lastModified}`,
    file,
    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
  }));

export default function AttachmentDropzone({
  items,
  onChange,
  maxFiles = 5,
  helperText,
  disabled = false,
  className = '',
}: Readonly<AttachmentDropzoneProps>) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const prevItemsRef = useRef<AttachmentItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = useCallback(
    (files: File[]) => {
      if (files.length + items.length > maxFiles) {
        return `Μπορείς να ανεβάσεις μέχρι ${maxFiles} αρχεία.`;
      }
      for (const file of files) {
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          return 'Επιτρέπονται μόνο PNG, JPG, WEBP ή PDF αρχεία.';
        }
        if (file.size > MAX_FILE_SIZE) {
          return 'Κάθε αρχείο πρέπει να είναι μέχρι 5MB.';
        }
      }
      return null;
    },
    [items.length, maxFiles],
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      const validationError = validateFiles(files);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      const nextItems = [...items, ...buildItems(files)];
      onChange(nextItems);
    },
    [items, onChange, validateFiles],
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    handleFiles(files);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleRemove = (id: string) => {
    const removed = items.find(item => item.id === id);
    if (removed?.previewUrl) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    const nextItems = items.filter(item => item.id !== id);
    onChange(nextItems);
  };

  useEffect(() => {
    const prevItems = prevItemsRef.current;
    const removed = prevItems.filter(prev => !items.some(item => item.id === prev.id));
    removed.forEach(item => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    prevItemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      prevItemsRef.current.forEach(item => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--hb-border)] bg-[var(--hb-panel)] px-4 py-6 text-center transition',
          disabled ? 'opacity-60' : 'hover:border-[var(--hb-primary-strong)]',
        )}
        onDrop={handleDrop}
        onDragOver={event => event.preventDefault()}
      >
        <UploadCloud className="h-7 w-7 text-[var(--hb-primary)]" />
        <div className="text-sm font-semibold text-[var(--hb-headline)]">
          Σύρε εδώ screenshots ή αρχεία
        </div>
        <div className="text-xs text-[var(--hb-muted)]">
          PNG, JPG, WEBP ή PDF έως 5MB (μέχρι {maxFiles} αρχεία)
        </div>
        {helperText ? <div className="text-xs text-[var(--hb-muted)]">{helperText}</div> : null}
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_MIME_TYPES.join(',')}
          multiple
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-4 py-2 text-xs font-semibold text-[var(--hb-text)] transition hover:border-[var(--hb-primary-strong)]"
          disabled={disabled}
        >
          Επιλογή αρχείων
        </button>
      </div>

      {error ? <FormErrorMessage message={error} /> : null}

      {items.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3"
            >
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-[var(--hb-panel)]">
                {item.previewUrl ? (
                  <Image
                    src={item.previewUrl}
                    alt={item.file.name || 'Screenshot preview'}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : item.file.type === 'application/pdf' ? (
                  <FileText className="h-6 w-6 text-[var(--hb-muted)]" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-[var(--hb-muted)]" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--hb-headline)]">
                  {item.file.name}
                </div>
                <div className="text-xs text-[var(--hb-muted)]">
                  {(item.file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="rounded-full p-1 text-[var(--hb-muted)] transition hover:text-[var(--hb-headline)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export type { AttachmentDropzoneProps };
