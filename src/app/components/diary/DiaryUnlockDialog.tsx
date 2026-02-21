'use client';

import { useState } from 'react';
import { Loader2, Lock, X } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

type DiaryUnlockDialogProps = {
  hasSalt: boolean;
  isInitializing?: boolean;
  isOpen: boolean;
  isResetting: boolean;
  isUnlocking: boolean;
  onDismiss?: () => void;
  onResetEncryption: () => Promise<boolean>;
  onUnlock: (passphrase: string) => Promise<boolean>;
};

export function DiaryUnlockDialog({
  hasSalt,
  isInitializing = false,
  isOpen,
  isResetting,
  isUnlocking,
  onDismiss,
  onResetEncryption,
  onUnlock,
}: DiaryUnlockDialogProps) {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [hasAcknowledgedRisk, setHasAcknowledgedRisk] = useState(false);
  const [isResetDialogOpen, setResetDialogOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<string | null>(null);

  const isSetupMode = !hasSalt;

  const handleUnlock = async () => {
    setLocalError(null);
    setLocalNotice(null);

    if (!passphrase.trim()) {
      setLocalError('Passphrase is required.');
      return;
    }

    if (isSetupMode && !hasAcknowledgedRisk) {
      setLocalError('Please confirm that passphrase recovery is not possible.');
      return;
    }

    if (isSetupMode && passphrase !== confirmPassphrase) {
      setLocalError('Passphrases do not match.');
      return;
    }

    const ok = await onUnlock(passphrase);
    if (!ok) {
      setLocalError('Unable to unlock diary with this passphrase.');
      return;
    }

    setPassphrase('');
    setConfirmPassphrase('');
  };

  const handleReset = async () => {
    setLocalError(null);
    setLocalNotice(null);
    const ok = await onResetEncryption();
    if (!ok) {
      setLocalError('Unable to reset diary encryption right now.');
      return;
    }

    setResetDialogOpen(false);
    setPassphrase('');
    setConfirmPassphrase('');
    setHasAcknowledgedRisk(false);
    setLocalNotice('Diary reset complete. Create a new passphrase to continue.');
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          onDismiss?.();
        }
      }}
    >
      <DialogContent showCloseButton={false} className="max-w-[480px]">
        <button
          type="button"
          onClick={() => onDismiss?.()}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {isInitializing ? 'Loading diary security' : isSetupMode ? 'Set diary passphrase' : 'Unlock diary'}
          </DialogTitle>
          <DialogDescription>
            {isInitializing
              ? 'Preparing encryption metadata...'
              : isSetupMode
              ? 'Passphrase is not stored. We cannot recover it. Keep it in a password manager before continuing.'
              : 'Enter your diary passphrase to derive your local decryption key. Passphrase is not stored and cannot be recovered.'}
          </DialogDescription>
        </DialogHeader>

        {isInitializing ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
            <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        ) : (
          <div className="space-y-3 py-2">
          <Input
            type="password"
            placeholder="Passphrase"
            value={passphrase}
            onChange={event => setPassphrase(event.target.value)}
            autoFocus
          />
          {isSetupMode ? (
            <Input
              type="password"
              placeholder="Confirm passphrase"
              value={confirmPassphrase}
              onChange={event => setConfirmPassphrase(event.target.value)}
            />
          ) : null}
          {isSetupMode ? (
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={hasAcknowledgedRisk}
                onChange={event => setHasAcknowledgedRisk(event.target.checked)}
              />
              <span>
                I understand this passphrase cannot be recovered. If I lose it, existing diary entries are
                unrecoverable. If I reset and set a new passphrase, existing entries are deleted
                automatically.
              </span>
            </label>
          ) : null}
          {!isSetupMode ? (
            <AlertDialog open={isResetDialogOpen} onOpenChange={setResetDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="px-0 text-destructive">
                  Forgot passphrase? Reset diary encryption
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset diary encryption?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes all encrypted diary entries and resets your encryption metadata.
                    You will set a new passphrase after reset.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={isResetting}
                    onClick={() => void handleReset()}
                  >
                    {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Reset diary encryption
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
          {localNotice ? <p className="text-xs text-emerald-600">{localNotice}</p> : null}
          {localError ? <p className="text-xs text-destructive">{localError}</p> : null}
          </div>
        )}

        <DialogFooter>
          <Button
            className="w-full sm:w-auto"
            onClick={() => void handleUnlock()}
            disabled={isInitializing || isUnlocking || isResetting}
          >
            {isInitializing || isUnlocking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isInitializing ? 'Loading...' : isSetupMode ? 'Set and unlock' : 'Unlock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
