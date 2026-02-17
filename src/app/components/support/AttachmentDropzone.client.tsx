'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/utils/utils';
import { FieldError } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

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
        return `You can upload up to ${maxFiles} files.`;
      }
      for (const file of files) {
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          return 'Only PNG, JPG, WEBP, or PDF files are allowed.';
        }
        if (file.size > MAX_FILE_SIZE) {
          return 'Each file must be 5MB or smaller.';
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
    if (files.length === 0) {
      return;
    }
    handleFiles(files);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) {
      return;
    }
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
          'flex min-h-[152px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center transition-[border-color,box-shadow] duration-200',
          disabled ? 'opacity-60' : 'hover:border-primary/60 hover:shadow-sm',
        )}
        onDrop={handleDrop}
        onDragOver={event => event.preventDefault()}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-primary">
          +
        </span>
        <div className="text-sm font-semibold text-foreground">Drop screenshots or files here</div>
        <div className="text-xs text-muted-foreground">
          PNG, JPG, WEBP, or PDF up to 5MB (max {maxFiles} files)
        </div>
        {helperText ? <div className="text-xs text-muted-foreground">{helperText}</div> : null}
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_MIME_TYPES.join(',')}
          multiple
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          className="rounded-full px-4 py-2"
          disabled={disabled}
        >
          Choose files
        </Button>
      </div>

      {error ? <FieldError>{error}</FieldError> : null}

      {items.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/70 p-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-[10px] border border-border/50 bg-card">
                {item.previewUrl ? (
                  <Image
                    src={item.previewUrl}
                    alt={item.file.name || 'Screenshot preview'}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {item.file.type === 'application/pdf' ? 'PDF' : 'FILE'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{item.file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(item.file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleRemove(item.id)}
                className="rounded-full p-2 text-muted-foreground"
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export type { AttachmentDropzoneProps };
