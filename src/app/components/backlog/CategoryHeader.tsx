'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { usePathname, useSearchParams } from 'next/navigation';
import { MediaCategory, CATEGORY_CONFIG } from './types';

interface CategoryHeaderProps {
  category: MediaCategory;
  username?: string | null;
  steamId?: string | null;
  isSteamSyncing?: boolean;
  onSteamSyncClick?: () => Promise<void>;
  onCreateClick: () => void;
  onSuggestionsClick: () => void;
}

export default function CategoryHeader({
  category,
  username,
  steamId,
  isSteamSyncing = false,
  onSteamSyncClick,
  onCreateClick,
  onSuggestionsClick,
}: Readonly<CategoryHeaderProps>) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeCategory = searchParams.get('category');
  const hasSteamId = Boolean(steamId?.trim());
  const [steamConfirmOpen, setSteamConfirmOpen] = useState(false);

  const showIntegrationMenu =
    pathname === '/pages/backlog' &&
    (routeCategory === 'anime' || routeCategory === 'manga' || routeCategory === 'games');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] text-primary sm:h-16 sm:w-16">
            <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground sm:text-xs">
              {username ? `${username} · ` : ''}
              {category.toUpperCase()}
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {config.title}
            </h1>
            <p className="text-sm text-muted-foreground sm:text-[15px]">{config.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={onCreateClick} className="h-10 rounded-[12px] px-4">
            Νέα καταχώρηση
          </Button>

          {showIntegrationMenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="h-10 rounded-[12px] px-4">
                  Συγχρονισμός
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
                        disabled={isSteamSyncing}
                      >
                        Steam
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
            className="h-10 rounded-[12px] px-4"
          >
            Προτάσεις
          </Button>
        </div>
      </div>

      <AlertDialog open={steamConfirmOpen} onOpenChange={setSteamConfirmOpen}>
        <AlertDialogContent className="hb-dialog-surface border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Steam συγχρονισμός</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Ο αυτόματος συγχρονισμός από Steam ορίζει μόνο status `Planned` ή `Current`. Τα
              `Completed` και `Dropped` τα ορίζεις χειροκίνητα.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSteamSyncing}>Άκυρο</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSteamSyncing}
              onClick={async event => {
                event.preventDefault();
                if (!onSteamSyncClick) {
                  setSteamConfirmOpen(false);
                  return;
                }
                await onSteamSyncClick();
                setSteamConfirmOpen(false);
              }}
            >
              {isSteamSyncing ? 'Γίνεται συγχρονισμός...' : 'Συνέχεια'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
