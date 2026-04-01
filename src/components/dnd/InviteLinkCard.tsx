'use client';

import { useMemo, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  campaignId: string;
  currentToken: string;
  requireRegenerateConfirmation?: boolean;
};

type InviteResponse = {
  data?: {
    token: string;
    invite_url: string;
  };
  error?: string;
};

export function InviteLinkCard({
  campaignId,
  currentToken,
  requireRegenerateConfirmation = false,
}: Props) {
  const [token, setToken] = useState(currentToken);
  const [regenerating, setRegenerating] = useState(false);
  const [copying, setCopying] = useState(false);

  const inviteUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return `/dnd/join/${token}`;
    }
    return `${window.location.origin}/dnd/join/${token}`;
  }, [token]);

  const handleCopy = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Invite link copied');
    } catch {
      toast.error('Unable to copy invite link');
    } finally {
      setCopying(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/invite`, {
        method: 'POST',
      });

      const payload = (await response.json()) as InviteResponse;
      if (!response.ok || !payload.data?.token) {
        throw new Error(payload.error ?? 'Failed to regenerate invite link');
      }

      setToken(payload.data.token);
      toast.success('Invite link regenerated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to regenerate invite link';
      toast.error(message);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border p-4 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="invite-link">Invite URL</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input id="invite-link" value={inviteUrl} readOnly className="h-12" />
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            disabled={copying}
            className="w-full sm:w-auto"
            icon={<Copy className="h-4 w-4" />}
          >
            {copying ? 'Copying...' : 'Copy'}
          </Button>
        </div>
      </div>

      <Alert>
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>Regenerating will invalidate the old link immediately.</AlertDescription>
      </Alert>

      {requireRegenerateConfirmation ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              disabled={regenerating}
              className="w-full sm:w-auto"
              icon={<RefreshCw className="h-4 w-4" />}
            >
              {regenerating ? 'Regenerating...' : 'Regenerate Link'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Regenerate invite link?</AlertDialogTitle>
              <AlertDialogDescription>
                The old link will stop working immediately for new joins.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  void handleRegenerate();
                }}
              >
                Regenerate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button
          type="button"
          variant="secondary"
          disabled={regenerating}
          className="w-full sm:w-auto"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={() => {
            void handleRegenerate();
          }}
        >
          {regenerating ? 'Regenerating...' : 'Regenerate Link'}
        </Button>
      )}
    </div>
  );
}
