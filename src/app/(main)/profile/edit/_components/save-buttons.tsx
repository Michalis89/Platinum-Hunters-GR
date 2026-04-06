'use client';

import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SaveButtonsProps {
  saving: boolean;
  isDirty: boolean;
  onCancel: () => void;
}

export function SaveButtons({ saving, isDirty, onCancel }: SaveButtonsProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-end gap-3 rounded-lg border bg-card/80 px-4 py-3 shadow-sm">
      {/* Primary Button */}
      <Button
        type="submit"
        variant={'primary'}
        disabled={saving || !isDirty}
        className="flex items-center gap-2"
      >
        <Save className="h-4 w-4" />
        <span>{saving ? 'Saving...' : 'Save'}</span>
      </Button>
      {/* Secondary Button */}
      <Button
        onClick={onCancel}
        disabled={saving}
        variant={'secondary'}
        className="flex items-center gap-2"
      >
        Cancel
      </Button>
    </div>
  );
}
