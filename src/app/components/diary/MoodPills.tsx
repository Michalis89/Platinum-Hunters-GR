'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { DIARY_MOODS, type DiaryMood } from '@/lib/diary/types';
import { cn } from '@/lib/utils';

const chipBaseClassName =
  'min-h-[var(--touch-min)] rounded-full border px-4 text-xs font-medium capitalize transition-[background-color,border-color,color,box-shadow] duration-200';
const chipActiveClassName =
  'border-[hsl(var(--border-default)/0.72)] bg-[hsl(var(--accent-muted)/0.34)] text-[hsl(var(--text-primary))]';
const chipIdleClassName =
  'border-[hsl(var(--border-subtle)/0.86)] bg-[hsl(var(--surface-overlay)/0.44)] text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--border-default)/0.95)] hover:bg-[hsl(var(--surface-hover)/0.74)] hover:text-[hsl(var(--text-primary))]';

type MoodPillsProps = {
  value: DiaryMood | null;
  disabled?: boolean;
  onChange: (mood: DiaryMood | null) => void;
};

function MoodPillsComponent({ value, disabled = false, onChange }: MoodPillsProps) {
  return (
    <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        className={cn(chipBaseClassName, value === null ? chipActiveClassName : chipIdleClassName)}
        aria-pressed={value === null}
        onClick={() => onChange(null)}
      >
        None
      </Button>
      {DIARY_MOODS.map(mood => (
        <Button
          key={mood}
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn(chipBaseClassName, value === mood ? chipActiveClassName : chipIdleClassName)}
          aria-pressed={value === mood}
          onClick={() => onChange(mood)}
        >
          {mood}
        </Button>
      ))}
    </div>
  );
}

export const MoodPills = memo(MoodPillsComponent);
