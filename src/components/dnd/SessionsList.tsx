'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Eye, Plus, ScrollText } from 'lucide-react';
import { toast } from 'sonner';
import type { CampaignSession, CampaignSessionPublic } from '@/lib/dnd/types';
import { SessionCard } from '@/components/dnd/SessionCard';
import { SessionFormSheet } from '@/components/dnd/SessionFormSheet';
import { PublishToggle } from '@/components/dnd/PublishToggle';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';

type SessionsResponse = {
  data?: CampaignSession[] | CampaignSessionPublic[];
  error?: string;
};

type Props = {
  campaignId: string;
  role: 'dm' | 'co_dm' | 'player';
};

function isDmRole(role: Props['role']) {
  return role === 'dm' || role === 'co_dm';
}

export function SessionsList({ campaignId, role }: Props) {
  const isDm = isDmRole(role);
  const [sessions, setSessions] = useState<(CampaignSession | CampaignSessionPublic)[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const selectedSession = useMemo(
    () => sessions.find(session => session.id === selectedSessionId) as CampaignSession | undefined,
    [selectedSessionId, sessions],
  );

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dnd/campaigns/${campaignId}/sessions`);
        const payload = (await response.json()) as SessionsResponse;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? 'Failed to load sessions');
        }

        setSessions(payload.data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load sessions';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadSessions();
  }, [campaignId]);

  const handleNewSession = () => {
    setSelectedSessionId(null);
    setOpenForm(true);
  };

  const handleEditSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setOpenForm(true);
  };

  const handleSessionSaved = (savedSession: CampaignSession) => {
    setSessions(current => {
      const index = current.findIndex(session => session.id === savedSession.id);
      if (index === -1) {
        return [savedSession, ...current];
      }

      const next = [...current];
      next[index] = savedSession;
      return next;
    });
  };

  const handlePublishToggle = async (sessionId: string, published: boolean) => {
    const previous = sessions;

    setSessions(current =>
      current.map(session =>
        session.id === sessionId ? { ...session, recap_published: published } : session,
      ),
    );

    try {
      const response = await fetch(`/api/dnd/campaigns/${campaignId}/sessions/${sessionId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to update published state');
      }

      toast.success(published ? 'Recap shared with players' : 'Recap hidden from players');
    } catch (error) {
      setSessions(previous);
      const message = error instanceof Error ? error.message : 'Failed to update published state';
      toast.error(message);
      throw error;
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
        <div className="flex justify-end">
          <Button type="button" onClick={handleNewSession} icon={<Plus className="h-4 w-4" />}>
            New Session
          </Button>
        </div>
      ) : null}

      {sessions.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<ScrollText className="h-5 w-5" />}
          title={isDm ? 'No sessions yet' : 'No published recaps yet'}
          description={
            isDm
              ? 'Create your first session to start planning your campaign timeline.'
              : 'Your DM has not published any session recaps yet.'
          }
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((session, index) => (
            <div key={session.id} className="animate-fade-in-up space-y-2" style={{ '--stagger': index } as CSSProperties}>
              <SessionCard
                session={session}
                isDm={isDm}
                onEdit={isDm ? () => handleEditSession(session.id) : undefined}
              />

              {isDm ? (
                <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    Published recap visibility
                  </div>
                  <PublishToggle
                    published={session.recap_published}
                    label="Share with players"
                    onToggle={nextValue => handlePublishToggle(session.id, nextValue)}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {isDm ? (
        <SessionFormSheet
          campaignId={campaignId}
          open={openForm}
          onOpenChange={setOpenForm}
          session={selectedSession ?? null}
          onSaved={handleSessionSaved}
        />
      ) : null}
    </div>
  );
}
