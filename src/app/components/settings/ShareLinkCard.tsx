'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, Check, RefreshCw, Trash2, Link } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SITE_URL =
  typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hobbistas-hub.com');

type ShareView = 'backlog' | 'dashboard';
type ShareCategory = 'games' | 'anime' | 'manga' | 'movies' | 'tv' | 'books';
type ShareStatus = 'all' | 'planned' | 'current' | 'completed' | 'dropped';
type ShareExpiry = 'never' | '7' | '30';

function inferExpirySelection(expiresAt: string | null): ShareExpiry {
  if (!expiresAt) {
    return 'never';
  }
  const millis = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(millis) || millis <= 0) {
    return '7';
  }
  const days = millis / (24 * 60 * 60 * 1000);
  return days > 18 ? '30' : '7';
}

export default function ShareLinkCard() {
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [view, setView] = useState<ShareView>('backlog');
  const [category, setCategory] = useState<ShareCategory>('games');
  const [status, setStatus] = useState<ShareStatus>('all');
  const [expiry, setExpiry] = useState<ShareExpiry>('never');
  const [selectPortalContainer, setSelectPortalContainer] = useState<HTMLDivElement | null>(null);

  const handleSelectPortalMount = useCallback((element: HTMLDivElement | null) => {
    setSelectPortalContainer(element);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    fetch('/api/me/share-token')
      .then(r => r.json())
      .then((data: { token?: string | null; expiresAt?: string | null }) => {
        setToken(data.token ?? null);
        const nextExpiresAt = data.expiresAt ?? null;
        setExpiresAt(nextExpiresAt);
        setExpiry(inferExpirySelection(nextExpiresAt));
      })
      .catch(() => {
        setToken(null);
        setExpiresAt(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const shareUrl = (() => {
    if (!token) {
      return null;
    }
    if (view === 'dashboard') {
      return `${SITE_URL}/share/${token}/dashboard`;
    }
    const params = new URLSearchParams({
      category,
      status,
    });
    return `${SITE_URL}/share/${token}?${params.toString()}`;
  })();

  const handleGenerate = async () => {
    setIsBusy(true);
    try {
      const expiresInDays = expiry === 'never' ? null : Number(expiry);
      const res = await fetch('/api/me/share-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays }),
      });
      const data = (await res.json()) as { token?: string; expiresAt?: string | null };
      if (!res.ok || !data.token) throw new Error();
      setToken(data.token);
      setExpiresAt(data.expiresAt ?? null);
      toast.success('Share link generated');
    } catch {
      toast.error('Failed to generate share link');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRevoke = async () => {
    setIsBusy(true);
    try {
      const res = await fetch('/api/me/share-token', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setToken(null);
      setExpiresAt(null);
      toast.success('Share link revoked');
    } catch {
      toast.error('Failed to revoke share link');
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Share Link</CardTitle>
        </div>
        <CardDescription>
          Generate a read-only invite link to share your library with anyone — even if your profile
          is private. Revoking the link instantly breaks all existing shares.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
        ) : (
          <div ref={handleSelectPortalMount} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="share-view">View</Label>
                <Select modal={false} value={view} onValueChange={value => setView(value as ShareView)}>
                  <SelectTrigger id="share-view" className="h-10 !min-h-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    portalContainer={selectPortalContainer ?? undefined}
                    className="data-[state=open]:animate-none data-[state=closed]:animate-none"
                  >
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="share-expiry">Expires</Label>
                <Select modal={false} value={expiry} onValueChange={value => setExpiry(value as ShareExpiry)}>
                  <SelectTrigger id="share-expiry" className="h-10 !min-h-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    portalContainer={selectPortalContainer ?? undefined}
                    className="data-[state=open]:animate-none data-[state=closed]:animate-none"
                  >
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {view === 'backlog' ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="share-category">Category</Label>
                    <Select modal={false} value={category} onValueChange={value => setCategory(value as ShareCategory)}>
                      <SelectTrigger id="share-category" className="h-10 !min-h-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                        portalContainer={selectPortalContainer ?? undefined}
                        className="data-[state=open]:animate-none data-[state=closed]:animate-none"
                      >
                        <SelectItem value="games">Games</SelectItem>
                        <SelectItem value="anime">Anime</SelectItem>
                        <SelectItem value="manga">Manga</SelectItem>
                        <SelectItem value="movies">Movies</SelectItem>
                        <SelectItem value="tv">TV</SelectItem>
                        <SelectItem value="books">Books</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="share-status">Status</Label>
                    <Select modal={false} value={status} onValueChange={value => setStatus(value as ShareStatus)}>
                      <SelectTrigger id="share-status" className="h-10 !min-h-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                        portalContainer={selectPortalContainer ?? undefined}
                        className="data-[state=open]:animate-none data-[state=closed]:animate-none"
                      >
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="current">Current</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="dropped">Dropped</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="md:col-span-2" />
              )}
            </div>

            {shareUrl ? (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                  <span className="flex-1 truncate text-sm text-muted-foreground">{shareUrl}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={handleCopy}
                    disabled={isBusy}
                    title="Copy link"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {expiresAt ? `Expires at ${new Date(expiresAt).toLocaleString()}` : 'Does not expire'}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No share link generated yet. Click the button below to create one.
              </p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        {shareUrl ? (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={handleGenerate}
              disabled={isBusy}
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Regenerate
            </Button>

            {isMounted && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isBusy}
                    className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Revoke
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke share link?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Anyone who has this link will immediately lose access. You can generate a new
                      one at any time.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" size="default" onClick={handleRevoke}>
                      Revoke link
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        ) : (
          <Button
            type="button"
            variant="primary"
            onClick={handleGenerate}
            disabled={isBusy || isLoading}
            className="w-full"
          >
            <Link className="mr-2 h-3.5 w-3.5" />
            Generate share link
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
