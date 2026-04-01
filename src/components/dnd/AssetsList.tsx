'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { FileImage, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { AssetUploader } from '@/components/dnd/AssetUploader';
import { TagInput } from '@/components/dnd/TagInput';
import { TrashButton } from '@/components/dnd/TrashButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';

type AssetType = 'image' | 'pdf' | 'other';

type CampaignAssetWithUrl = {
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
  isDm: boolean;
};

type AssetsResponse = {
  data?: CampaignAssetWithUrl[];
  error?: string;
};

export function AssetsList({ campaignId, isDm }: Props) {
  const [assets, setAssets] = useState<CampaignAssetWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  const editingAsset = useMemo(
    () => assets.find(item => item.id === editingId) ?? null,
    [assets, editingId],
  );

  const imageAssets = useMemo(() => assets.filter(item => item.type === 'image'), [assets]);
  const fileAssets = useMemo(() => assets.filter(item => item.type !== 'image'), [assets]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dnd/campaigns/${campaignId}/assets`);
        const payload = (await response.json()) as AssetsResponse;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? 'Failed to load assets');
        }

        setAssets(payload.data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load assets';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [campaignId]);

  useEffect(() => {
    if (!sheetOpen || !editingAsset) {
      return;
    }

    setTitle(editingAsset.title ?? '');
    setTags(editingAsset.tags);
    setPublished(editingAsset.published);
  }, [editingAsset, sheetOpen]);

  const updateAssetMeta = async (assetId: string, changes: Partial<CampaignAssetWithUrl>) => {
    const previous = [...assets];
    setAssets(current => current.map(item => (item.id === assetId ? { ...item, ...changes } : item)));

    try {
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/assets/${assetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      const payload = (await response.json()) as { data?: CampaignAssetWithUrl; error?: string };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to update asset metadata');
      }

      setAssets(current => current.map(item => (item.id === assetId ? payload.data! : item)));
    } catch (error) {
      setAssets(previous);
      throw error;
    }
  };

  const deleteAsset = async (assetId: string) => {
    const previous = [...assets];
    setAssets(current => current.filter(item => item.id !== assetId));

    try {
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/assets/${assetId}`, {
        method: 'DELETE',
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to delete asset');
      }

      toast.success('Asset moved to trash');
    } catch (error) {
      setAssets(previous);
      const message = error instanceof Error ? error.message : 'Failed to delete asset';
      toast.error(message);
    }
  };

  const openEditSheet = (assetId: string) => {
    setEditingId(assetId);
    setSheetOpen(true);
  };

  const handleSaveMeta = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingAsset) {
      return;
    }

    try {
      setSaving(true);
      await updateAssetMeta(editingAsset.id, {
        title: title.trim() || null,
        tags,
        published,
      });
      toast.success('Asset metadata updated');
      setSheetOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update asset metadata';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isDm ? (
        <AssetUploader campaignId={campaignId} onUploaded={asset => setAssets(current => [asset, ...current])} />
      ) : null}

      {assets.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<FileText className="h-5 w-5" />}
          title="No assets yet"
          description={isDm ? 'Upload maps, images, and PDFs.' : 'No published assets yet.'}
        />
      ) : (
        <>
          {imageAssets.length > 0 ? (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Images</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {imageAssets.map(asset => (
                  <Card key={asset.id} className="shadow-sm">
                    <CardContent className="space-y-2 p-3">
                      {asset.signed_url ? (
                        <img
                          src={asset.signed_url}
                          alt={asset.title ?? 'Asset'}
                          className="h-40 w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center rounded-lg bg-muted">
                          <FileImage className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}

                      <p className="truncate text-sm font-medium">{asset.title ?? asset.path}</p>

                      {asset.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {asset.tags.map(tag => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : null}

                      {isDm ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={asset.published}
                              onCheckedChange={next => {
                                void updateAssetMeta(asset.id, { published: next }).catch(error => {
                                  const message = error instanceof Error ? error.message : 'Failed to update visibility';
                                  toast.error(message);
                                });
                              }}
                            />
                            <span className="text-xs text-muted-foreground">Share with players</span>
                          </div>

                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => openEditSheet(asset.id)}>
                              Edit
                            </Button>
                            <TrashButton
                              onDelete={async () => deleteAsset(asset.id)}
                              entityName="Asset"
                              size="sm"
                            />
                          </div>
                        </div>
                      ) : (
                        asset.signed_url ? (
                          <Button type="button" variant="outline" size="sm" onClick={() => window.open(asset.signed_url!, '_blank', 'noopener,noreferrer')}>
                            Open
                          </Button>
                        ) : null
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {fileAssets.length > 0 ? (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Documents</h3>
              <div className="space-y-2">
                {fileAssets.map(asset => (
                  <Card key={asset.id} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">{asset.title ?? asset.path}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{asset.type === 'pdf' ? 'PDF' : 'File'}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {asset.signed_url ? (
                          <Button type="button" variant="outline" size="sm" onClick={() => window.open(asset.signed_url!, '_blank', 'noopener,noreferrer')}>
                            Download
                          </Button>
                        ) : null}

                        {isDm ? (
                          <>
                            <Button type="button" variant="outline" size="sm" onClick={() => openEditSheet(asset.id)}>
                              Edit
                            </Button>
                            <TrashButton
                              onDelete={async () => deleteAsset(asset.id)}
                              entityName="Asset"
                              size="sm"
                            />
                          </>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      {isDm && editingAsset ? (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Edit Asset</SheetTitle>
              <SheetDescription>Update title, tags, and visibility.</SheetDescription>
            </SheetHeader>

            <form onSubmit={handleSaveMeta} className="mt-6 space-y-4">
              <Input
                label="Title"
                value={title}
                onChange={event => setTitle(event.target.value)}
                className="h-12"
                maxLength={200}
              />

              <div className="space-y-2">
                <p className="text-sm font-medium">Tags</p>
                <TagInput value={tags} onChange={setTags} />
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2">
                <Switch checked={published} onCheckedChange={setPublished} />
                <span className="text-sm text-muted-foreground">Share with players</span>
              </div>

              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}
