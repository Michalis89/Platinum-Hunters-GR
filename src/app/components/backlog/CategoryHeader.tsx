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
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="bg-[var(--hb-primary-strong)]/20 flex h-12 w-12 items-center justify-center rounded-2xl text-[var(--hb-primary-strong)] shadow-[var(--hb-shadow-md)] sm:h-14 sm:w-14">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--hb-muted)] sm:text-xs sm:tracking-[0.35em]">
            {username ? `${username} \u2022 ` : ''}
            {category.toUpperCase()}
          </p>
          <h1 className="text-2xl font-bold text-[var(--hb-headline)] sm:text-3xl md:text-4xl">
            {config.title}
          </h1>
          <p className="text-sm text-[var(--hb-muted)]">{config.subtitle}</p>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
        <Button variant="primary" onClick={onCreateClick} className="w-full sm:w-auto">
          {'\u039d\u03ad\u03b1 \u03ba\u03b1\u03c4\u03b1\u03c7\u03ce\u03c1\u03b7\u03c3\u03b7'}
        </Button>

        {showIntegrationMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="w-full sm:w-auto">
                {'\u03a3\u03c5\u03b3\u03c7\u03c1\u03bf\u03bd\u03b9\u03c3\u03bc\u03cc\u03c2 \u03bc\u03b5..'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {routeCategory === 'anime' || routeCategory === 'manga' ? (
                <>
                  <DropdownMenuItem
                    onClick={() =>
                      (window.location.href = `/api/integrations/mal/start?category=${routeCategory}`)
                    }
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
                      onClick={() => setSteamConfirmOpen(true)}
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

        <Button variant="secondary" onClick={onSuggestionsClick} className="w-full sm:w-auto">
          {'\u03a0\u03c1\u03bf\u03c4\u03ac\u03c3\u03b5\u03b9\u03c2'}
        </Button>
      </div>

      <AlertDialog open={steamConfirmOpen} onOpenChange={setSteamConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Steam συγχρονισμός</AlertDialogTitle>
            <AlertDialogDescription>
              Ο αυτόματος συγχρονισμός από Steam ορίζει μόνο status `Planned` ή `Current`.
              Τα `Completed` και `Dropped` τα ορίζεις χειροκίνητα.
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
