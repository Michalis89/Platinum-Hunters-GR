'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { CreateCampaignInput } from '@/lib/dnd/types';
import { CampaignForm } from '@/components/dnd/CampaignForm';
import { InviteLinkCard } from '@/components/dnd/InviteLinkCard';
import { TrashPanel } from '@/components/dnd/TrashPanel';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Trash2 } from 'lucide-react';

type CampaignData = {
  id: string;
  name: string;
  system: string | null;
  description: string | null;
  invite_token: string;
};

type CampaignMemberRow = {
  id: string;
  user_id: string;
  role: 'dm' | 'co_dm' | 'player';
  joined_at: string;
  user: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

type CampaignResponse = {
  data?: CampaignData;
  error?: string;
};

type MembersResponse = {
  data?: CampaignMemberRow[];
  error?: string;
};

type Props = {
  campaignId: string;
};

function formatJoinedDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

export function CampaignSettingsPanel({ campaignId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [members, setMembers] = useState<CampaignMemberRow[]>([]);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deletingCampaign, setDeletingCampaign] = useState(false);
  const [removingMember, setRemovingMember] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [campaignResponse, membersResponse] = await Promise.all([
          fetch(`/api/dnd/campaigns/${campaignId}`),
          fetch(`/api/dnd/campaigns/${campaignId}/members`),
        ]);

        const campaignPayload = (await campaignResponse.json()) as CampaignResponse;
        const membersPayload = (await membersResponse.json()) as MembersResponse;

        if (!campaignResponse.ok || !campaignPayload.data) {
          throw new Error(campaignPayload.error ?? 'Failed to load campaign settings');
        }

        if (!membersResponse.ok || !membersPayload.data) {
          throw new Error(membersPayload.error ?? 'Failed to load campaign members');
        }

        setCampaign(campaignPayload.data);
        setMembers(membersPayload.data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load settings';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [campaignId]);

  const handleCampaignUpdate = async (data: CreateCampaignInput) => {
    const response = await fetch(`/api/dnd/campaigns/${campaignId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const payload = (await response.json()) as CampaignResponse;
    if (!response.ok || !payload.data) {
      throw new Error(payload.error ?? 'Failed to update campaign');
    }

    setCampaign(payload.data);
    toast.success('Campaign info updated');
  };

  const handleRemoveMember = async (targetMember: CampaignMemberRow) => {
    try {
      setRemovingMember(true);
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: targetMember.user_id }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to remove member');
      }

      setMembers(current => current.filter(member => member.user_id !== targetMember.user_id));
      toast.success('Member removed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove member';
      toast.error(message);
    } finally {
      setRemovingMember(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaign || deleteConfirmName !== campaign.name) {
      return;
    }

    try {
      setDeletingCampaign(true);
      const response = await fetch(`/api/dnd/campaigns/${campaignId}`, {
        method: 'DELETE',
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to delete campaign');
      }

      toast.success('Campaign moved to trash');
      router.push('/dnd/campaigns');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete campaign';
      toast.error(message);
    } finally {
      setDeletingCampaign(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return <p className="text-sm text-muted-foreground">Unable to load campaign settings.</p>;
  }

  return (
    <div className="space-y-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Campaign Info</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignForm
              defaultValues={{
                name: campaign.name,
                system: campaign.system,
                description: campaign.description,
              }}
              submitLabel="Save Campaign Info"
              onSubmit={handleCampaignUpdate}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Invite Link</CardTitle>
          </CardHeader>
          <CardContent>
            <InviteLinkCard
              campaignId={campaignId}
              currentToken={campaign.invite_token}
              requireRegenerateConfirmation
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.map(member => {
              const displayName =
                member.user?.display_name?.trim() || member.user?.username || member.user_id;
              const canRemove = member.role === 'player';

              return (
                <div key={member.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    {member.user?.avatar_url ? (
                      <img src={member.user.avatar_url} alt={displayName} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                        {displayName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground">{displayName}</p>
                      <p className="text-xs text-muted-foreground">Joined {formatJoinedDate(member.joined_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={member.role === 'player' ? 'secondary' : 'default'}>
                      {member.role === 'player' ? 'Player' : 'DM'}
                    </Badge>

                    {canRemove ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm">
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove {displayName} from the campaign.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              disabled={removingMember}
                              onClick={() => {
                                void handleRemoveMember(member);
                              }}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-destructive/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Moving this campaign to trash hides it immediately. You can restore it within 30 days.
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => setTrashOpen(true)}
            >
              View Trash
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">Move Campaign to Trash</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Move campaign to trash?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Type <strong>{campaign.name}</strong> to confirm deletion.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  value={deleteConfirmName}
                  onChange={event => setDeleteConfirmName(event.target.value)}
                  placeholder={campaign.name}
                  className="h-12"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={deletingCampaign || deleteConfirmName !== campaign.name}
                    onClick={() => {
                      void handleDeleteCampaign();
                    }}
                  >
                    Move to Trash
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
        <TrashPanel campaignId={campaignId} open={trashOpen} onOpenChange={setTrashOpen} />
      </div>
  );
}
