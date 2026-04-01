'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DndReferenceCategory, ReferenceSearchResult } from '@/lib/dnd/types';
import { Input } from '@/components/ui/input';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  category: DndReferenceCategory;
  className?: string;
};

type SearchPayload = {
  data?: ReferenceSearchResult[];
  error?: string;
};

const DEBOUNCE_MS = 300;

export function Open5eCombobox({ label, value, onChange, category, className }: Props) {
  const [inputValue, setInputValue] = useState(value);
  const [results, setResults] = useState<ReferenceSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/dnd/reference/search?category=${category}&q=${encodeURIComponent(query.trim())}`,
        );
        const payload = (await response.json()) as SearchPayload;
        const items = payload.data ?? [];
        setResults(items.slice(0, 8));
        setOpen(items.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
    search(newValue);
  };

  const handleSelect = (name: string) => {
    setInputValue(name);
    onChange(name);
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          label={label}
          value={inputValue}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          className="h-12 pr-8"
          autoComplete="off"
        />
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground opacity-50" />
          )}
        </div>
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-md">
          {results.map(item => (
            <li key={`${item.category}:${item.index}`}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleSelect(item.name)}
              >
                <Check
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    inputValue.toLowerCase() === item.name.toLowerCase()
                      ? 'opacity-100 text-primary'
                      : 'opacity-0',
                  )}
                />
                <span className="flex-1 text-left">{item.name}</span>
                {item.source ? (
                  <span className="text-xs text-muted-foreground">{item.source}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
