'use client';

import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { TrashEntityType, TrashItem, TrashItems } from '@/lib/dnd/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TrashPanelProps = {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type TrashResponse = {
  data?: TrashItems;
  error?: string;
};

type TrashTab = {
  value: keyof TrashItems;
  label: string;
  entityType: TrashEntityType;
};

const TRASH_TABS: TrashTab[] = [
  { value: 'sessions', label: 'Sessions', entityType: 'session' },
  { value: 'npcs', label: 'NPCs', entityType: 'npc' },
  { value: 'locations', label: 'Locations', entityType: 'location' },
  { value: 'quests', label: 'Quests', entityType: 'quest' },
  { value: 'handouts', label: 'Handouts', entityType: 'handout' },
  { value: 'assets', label: 'Assets', entityType: 'asset' },
];

function daysSinceDeleted(deletedAt: string): number {
  const deletedMs = Date.parse(deletedAt);
  if (!Number.isFinite(deletedMs)) {
    return 0;
  }
  const diff = Date.now() - deletedMs;
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

export function TrashPanel({ campaignId, open, onOpenChange }: TrashPanelProps) {
  const [activeTab, setActiveTab] = useState<keyof TrashItems>('sessions');
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [trash, setTrash] = useState<TrashItems>({
    sessions: [],
    npcs: [],
    locations: [],
    quests: [],
    handouts: [],
    assets: [],
  });

  const hasItems = useMemo(
    () =>
      trash.sessions.length > 0 ||
      trash.npcs.length > 0 ||
      trash.locations.length > 0 ||
      trash.quests.length > 0 ||
      trash.handouts.length > 0 ||
      trash.assets.length > 0,
    [trash],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const loadTrash = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dnd/campaigns/${campaignId}/trash`, { cache: 'no-store' });
        const payload = (await response.json()) as TrashResponse;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? 'Failed to load trash');
        }
        setTrash(payload.data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load trash';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadTrash();
  }, [campaignId, open]);

  const restoreItem = async (entityType: TrashEntityType, entityId: string, listKey: keyof TrashItems) => {
    try {
      setSubmittingId(entityId);
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/trash/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to restore item');
      }

      setTrash(current => ({
        ...current,
        [listKey]: current[listKey].filter(item => item.id !== entityId),
      }));
      toast.success('Item restored');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore item';
      toast.error(message);
    } finally {
      setSubmittingId(null);
    }
  };

  const deleteForever = async (entityType: TrashEntityType, entityId: string, listKey: keyof TrashItems) => {
    try {
      setSubmittingId(entityId);
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/trash`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to delete item permanently');
      }

      setTrash(current => ({
        ...current,
        [listKey]: current[listKey].filter(item => item.id !== entityId),
      }));
      toast.success('Item deleted permanently');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete item permanently';
      toast.error(message);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="h-[100dvh] w-full max-w-none border-l border-border p-0 sm:w-[92vw] sm:max-w-4xl"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Trash2 className="size-4" />
            Campaign Trash
          </SheetTitle>
          <SheetDescription>
            Items are permanently deleted after 30 days.
          </SheetDescription>
        </SheetHeader>

        <div className="h-[calc(100dvh-86px)] overflow-y-auto p-4 md:p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : !hasItems ? (
            <EmptyState
              icon={<Trash2 className="size-5" />}
              title="Trash is empty"
              description="Deleted items will appear here for 30 days."
            />
          ) : (
            <Tabs value={activeTab} onValueChange={value => setActiveTab(value as keyof TrashItems)} className="space-y-4">
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <TabsList className="h-auto w-max min-w-full justify-start gap-1">
                  {TRASH_TABS.map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {TRASH_TABS.map(tab => (
                <TabsContent key={tab.value} value={tab.value} className="space-y-2">
                  {trash[tab.value].length === 0 ? (
                    <EmptyState
                      size="sm"
                      icon={<Trash2 className="size-5" />}
                      title={`No ${tab.label.toLowerCase()} in trash`}
                    />
                  ) : (
                    <div className="space-y-2">
                      {trash[tab.value].map((item: TrashItem) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Deleted {daysSinceDeleted(item.deleted_at)} day(s) ago
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={submittingId === item.id}
                              icon={<RotateCcw className="h-4 w-4" />}
                              onClick={() => {
                                void restoreItem(tab.entityType, item.id, tab.value);
                              }}
                            >
                              Restore
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  disabled={submittingId === item.id}
                                  icon={<Trash2 className="h-4 w-4" />}
                                >
                                  Delete Forever
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete forever?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    variant="destructive"
                                    onClick={() => {
                                      void deleteForever(tab.entityType, item.id, tab.value);
                                    }}
                                  >
                                    Delete Forever
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
