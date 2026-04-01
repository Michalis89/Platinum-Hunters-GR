'use client';

import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AssetType = 'image' | 'pdf' | 'other';

type AssetWithUrl = {
  id: string;
  campaign_id: string;
  path: string;
  type: AssetType | null;
  title: string | null;
  tags: string[];
  published: boolean;
  created_by: string;
  created_at: string;
  signed_url: string | null;
};

type Props = {
  campaignId: string;
  onUploaded: (asset: AssetWithUrl) => void;
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

function detectAssetType(file: File): AssetType {
  if (file.type === 'application/pdf') {
    return 'pdf';
  }

  if (file.type.startsWith('image/')) {
    return 'image';
  }

  return 'other';
}

function extensionFromFile(file: File): string {
  const parts = file.name.split('.');
  const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  if (ext) {
    return ext;
  }
  if (file.type === 'application/pdf') {
    return 'pdf';
  }
  return 'bin';
}

export function AssetUploader({ campaignId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, WEBP, GIF, and PDF files are allowed.';
    }

    if (file.size > MAX_SIZE_BYTES) {
      return 'File size must be 10MB or less.';
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    const validation = validateFile(file);
    if (validation) {
      toast.error(validation);
      return;
    }

    const assetId = crypto.randomUUID();
    const ext = extensionFromFile(file);
    const path = `${campaignId}/${assetId}.${ext}`;
    const type = detectAssetType(file);

    try {
      setUploading(true);
      setProgress(20);

      const { error: uploadError } = await supabase.storage.from('campaign-assets').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setProgress(70);

      const response = await fetch(`/api/dnd/campaigns/${campaignId}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          type,
          title: file.name,
          tags: [],
          published: false,
        }),
      });

      const payload = (await response.json()) as { data?: AssetWithUrl; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to save asset metadata');
      }

      setProgress(100);
      onUploaded(payload.data);
      toast.success('Asset uploaded');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload asset';
      toast.error(message);
    } finally {
      setTimeout(() => setProgress(0), 300);
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      <div
        className={`rounded-lg border border-dashed p-4 transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}`}
        onDragEnter={event => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={event => event.preventDefault()}
        onDragLeave={event => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={event => {
          event.preventDefault();
          setDragActive(false);
          const file = event.dataTransfer.files?.[0];
          if (file) {
            void uploadFile(file);
          }
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Upload Asset</p>
            <p className="text-xs text-muted-foreground">Drag and drop, or choose a file (max 10MB).</p>
          </div>
          <Button
            type="button"
            variant="outline"
            icon={<UploadCloud className="h-4 w-4" />}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Select File'}
          </Button>
        </div>

        <Input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          className="hidden"
          onChange={event => {
            const file = event.target.files?.[0];
            if (file) {
              void uploadFile(file);
            }
          }}
        />
      </div>

      {uploading || progress > 0 ? (
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">Upload progress: {progress}%</p>
        </div>
      ) : null}
    </div>
  );
}
