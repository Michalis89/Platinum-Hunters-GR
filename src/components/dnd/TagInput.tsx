'use client';

import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type TagInputProps = {
  value: string[];
  onChange: (nextTags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
};

function normalizeTag(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function TagInput({ value, onChange, placeholder = 'Add tag', disabled = false }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (raw: string) => {
    const next = normalizeTag(raw);
    if (!next) {
      return;
    }

    if (value.some(tag => tag.toLowerCase() === next.toLowerCase())) {
      setInputValue('');
      return;
    }

    onChange([...value, next]);
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(inputValue);
      return;
    }

    if (event.key === 'Backspace' && inputValue.length === 0 && value.length > 0) {
      event.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <Input
        value={inputValue}
        onChange={event => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(inputValue)}
        placeholder={placeholder}
        className="h-12"
        disabled={disabled}
      />

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto min-h-0 px-0 py-0"
                onClick={() => removeTag(tag)}
                disabled={disabled}
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
