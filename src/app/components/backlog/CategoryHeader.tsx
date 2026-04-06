'use client';

import { useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Check, Copy, Lightbulb, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/context/LocaleContext';
import type { MediaCategory } from './types';
import { CATEGORY_CONFIG } from './types';

interface CategoryHeaderProps {
  category: MediaCategory;
  username?: string | null;
  steamId?: string | null;
  isSteamSyncing?: boolean;
  isSteamRateLimited?: boolean;
  steamRateLimitResetTime?: Date | null;
  onSteamSyncClick?: () => Promise<void>;
  onCreateClick: () => void;
  onSuggestionsClick: () => void;
  isReadOnly?: boolean;
}

export default function CategoryHeader({
  category,
  username,
  steamId,
  isSteamSyncing = false,
  isSteamRateLimited = false,
  steamRateLimitResetTime,
  onSteamSyncClick,
  onCreateClick,
  onSuggestionsClick,
  isReadOnly = false,
}: Readonly<CategoryHeaderProps>) {
  const locale = useLocale();
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeCategory = searchParams.get('category');
  const hasSteamId = Boolean(steamId?.trim());
  const [steamConfirmOpen, setSteamConfirmOpen] = useState(false);
  const [isShareCopied, setIsShareCopied] = useState(false);

  const showIntegrationMenu =
    pathname === '/backlog' &&
    (routeCategory === 'anime' || routeCategory === 'manga' || routeCategory === 'games');
  const canShareBacklog = pathname === '/backlog' && Boolean(username?.trim());

  const handleCopyShareLink = async () => {
    if (!username?.trim() || typeof window === 'undefined') {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('category', category);
    const status = nextParams.get('status');
    if (!status) {
      nextParams.set('status', 'all');
    }
    const url = `${window.location.origin}/u/${encodeURIComponent(username)}/backlog?${nextParams.toString()}`;

    try {
      await navigator.clipboard.writeText(url);
      setIsShareCopied(true);
      toast.success('Share link copied');
      setTimeout(() => setIsShareCopied(false), 1800);
    } catch {
      toast.error('Failed to copy share link');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.28),transparent_70%)]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.18),transparent_70%)]" />
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary sm:h-20 sm:w-20">
              <Icon className="h-8 w-8" />
            </div>
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground sm:text-xs">
                {username ? `${username} - ` : ''}
                {category.toUpperCase()}
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                {config.title}
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                {config.subtitle}
              </p>
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="primary"
                onClick={onCreateClick}
                className="h-11 rounded-xl px-5 text-sm shadow-md"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>

              {showIntegrationMenu ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      className="h-11 rounded-xl border-border/60 bg-card/60 px-4 text-muted-foreground"
                    >
                      Sync
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-56">
                    {routeCategory === 'anime' || routeCategory === 'manga' ? (
                      <>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onSelect={() => {
                            window.location.href = `/api/integrations/mal/start?category=${routeCategory}`;
                          }}
                        >
                          MyAnimeList
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>AniList (soon)</DropdownMenuItem>
                      </>
                    ) : null}

                    {routeCategory === 'games' ? (
                      <>
                        {hasSteamId ? (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onSelect={() => setSteamConfirmOpen(true)}
                            disabled={isSteamSyncing || isSteamRateLimited}
                          >
                            <div className="flex flex-col">
                              <span>Steam</span>
                              {isSteamRateLimited && steamRateLimitResetTime && (
                                <span className="text-xs text-muted-foreground">
                                  Rate limit - try after{' '}
                                  {steamRateLimitResetTime.toLocaleString(locale, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem disabled>PlayStation Network (soon)</DropdownMenuItem>
                        <DropdownMenuItem disabled>Xbox (soon)</DropdownMenuItem>
                        <DropdownMenuItem disabled>Epic Games (soon)</DropdownMenuItem>
                        <DropdownMenuItem disabled>GOG (soon)</DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}

              <Button
                variant="secondary"
                onClick={onSuggestionsClick}
                className="h-11 rounded-xl border-border/60 bg-card/60 px-4 text-muted-foreground"
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                Personal Suggestions
              </Button>

              {canShareBacklog ? (
                <Button
                  variant="secondary"
                  onClick={() => void handleCopyShareLink()}
                  className="h-11 rounded-xl border-border/60 bg-card/60 px-4 text-muted-foreground"
                >
                  {isShareCopied ? (
                    <Check className="mr-2 h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Share
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={steamConfirmOpen} onOpenChange={setSteamConfirmOpen}>
        <AlertDialogContent className="hb-dialog-surface border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Steam sync</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {isSteamRateLimited && steamRateLimitResetTime ? (
                <span className="text-warning">
                  ⚠️ IGDB rate limit reached. Please try again after{' '}
                  {steamRateLimitResetTime.toLocaleString(locale, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  .
                </span>
              ) : (
                <>
                  Automatic Steam sync sets only `Planned` or `Current`. Set `Completed` and
                  `Dropped` manually. Uses IGDB free tier (rate limited).
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSteamSyncing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSteamSyncing || isSteamRateLimited}
              onClick={async event => {
                event.preventDefault();
                if (!onSteamSyncClick || isSteamRateLimited) {
                  setSteamConfirmOpen(false);
                  return;
                }
                await onSteamSyncClick();
                setSteamConfirmOpen(false);
              }}
            >
              {isSteamSyncing ? 'Syncing...' : isSteamRateLimited ? 'Rate Limited' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
