'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import type { CampaignMember, CampaignSession, CreateSessionInput } from '@/lib/dnd/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/ui/select-field';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { PublishToggle } from '@/components/dnd/PublishToggle';

type SessionPayload = {
  data?: CampaignSession;
  error?: string;
};

type AttendancePayload = {
  data?: {
    user_ids: string[];
  };
  error?: string;
};

type MembersPayload = {
  data?: CampaignMember[];
  error?: string;
};

type Props = {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: CampaignSession | null;
  onSaved: (session: CampaignSession) => void;
};

function sessionDateToInputValue(sessionDate: string | null | undefined): string {
  if (!sessionDate) {
    return '';
  }

  const parsed = new Date(sessionDate);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 10);
}

export function SessionFormSheet({ campaignId, open, onOpenChange, session, onSaved }: Props) {
  const isEditing = Boolean(session);

  const [title, setTitle] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [status, setStatus] = useState<'planned' | 'played' | 'cancelled'>('planned');
  const [agenda, setAgenda] = useState('');
  const [recap, setRecap] = useState('');
  const [dmNotes, setDmNotes] = useState('');
  const [recapPublished, setRecapPublished] = useState(false);
  const [members, setMembers] = useState<CampaignMember[]>([]);
  const [attendance, setAttendance] = useState<string[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(session?.title ?? '');
    setSessionDate(sessionDateToInputValue(session?.session_date));
    setStatus(session?.status ?? 'planned');
    setAgenda(session?.agenda ?? '');
    setRecap(session?.recap ?? '');
    setDmNotes(session?.dm_notes ?? '');
    setRecapPublished(session?.recap_published ?? false);
    setAttendance([]);
  }, [open, session]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const fetchMembersAndAttendance = async () => {
      try {
        setMembersLoading(true);

        const membersResponse = await fetch(`/api/dnd/campaigns/${campaignId}/members`);
        const membersPayload = (await membersResponse.json()) as MembersPayload;
        if (!membersResponse.ok || !membersPayload.data) {
          throw new Error(membersPayload.error ?? 'Failed to load campaign members');
        }

        setMembers(membersPayload.data);

        if (session?.id) {
          const attendanceResponse = await fetch(
            `/api/dnd/campaigns/${campaignId}/sessions/${session.id}/attendance`,
          );
          const attendancePayload = (await attendanceResponse.json()) as AttendancePayload;
          if (!attendanceResponse.ok || !attendancePayload.data) {
            throw new Error(attendancePayload.error ?? 'Failed to load attendance');
          }

          setAttendance(attendancePayload.data.user_ids);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load form data';
        toast.error(message);
      } finally {
        setMembersLoading(false);
      }
    };

    void fetchMembersAndAttendance();
  }, [campaignId, open, session?.id]);

  const memberOptions = useMemo(
    () =>
      members.map(member => ({
        id: member.user_id,
        label: `${member.user_id.slice(0, 8)}... (${member.role === 'player' ? 'Player' : 'DM'})`,
      })),
    [members],
  );

  const handleAttendanceToggle = (userId: string, checked: boolean) => {
    setAttendance(current => {
      if (checked) {
        return current.includes(userId) ? current : [...current, userId];
      }

      return current.filter(id => id !== userId);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error('Session title is required');
      return;
    }

    const payload: CreateSessionInput = {
      title: title.trim(),
      session_date: sessionDate ? sessionDate : null,
      status,
      agenda: agenda.trim() ? agenda.trim() : null,
      recap: recap.trim() ? recap.trim() : null,
      dm_notes: dmNotes.trim() ? dmNotes.trim() : null,
    };

    try {
      setSubmitting(true);

      const baseUrl = `/api/dnd/campaigns/${campaignId}/sessions`;
      const response = await fetch(isEditing && session ? `${baseUrl}/${session.id}` : baseUrl, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responsePayload = (await response.json()) as SessionPayload;
      if (!response.ok || !responsePayload.data) {
        throw new Error(responsePayload.error ?? 'Failed to save session');
      }

      const savedSession = responsePayload.data;

      if (savedSession.recap_published !== recapPublished) {
        const publishResponse = await fetch(
          `/api/dnd/campaigns/${campaignId}/sessions/${savedSession.id}/publish`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ published: recapPublished }),
          },
        );

        const publishPayload = (await publishResponse.json()) as { error?: string };
        if (!publishResponse.ok) {
          throw new Error(publishPayload.error ?? 'Failed to update publish state');
        }

        savedSession.recap_published = recapPublished;
      }

      const attendanceResponse = await fetch(
        `/api/dnd/campaigns/${campaignId}/sessions/${savedSession.id}/attendance`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_ids: attendance }),
        },
      );
      const attendancePayload = (await attendanceResponse.json()) as { error?: string };
      if (!attendanceResponse.ok) {
        throw new Error(attendancePayload.error ?? 'Failed to update attendance');
      }

      toast.success(isEditing ? 'Session updated' : 'Session created');
      onSaved(savedSession);
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save session';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Session' : 'New Session'}</SheetTitle>
          <SheetDescription>Update your session plan, recap, and attendance.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={event => setTitle(event.target.value)}
            required
            maxLength={200}
            className="h-12"
          />

          <Input
            label="Session Date"
            type="date"
            value={sessionDate}
            onChange={event => setSessionDate(event.target.value)}
            className="h-12"
          />

          <SelectField
            label="Status"
            options={['planned', 'played', 'cancelled']}
            value={status}
            onChange={value => setStatus((value || 'planned') as 'planned' | 'played' | 'cancelled')}
            optionLabels={{ planned: 'Planned', played: 'Played', cancelled: 'Cancelled' }}
          />

          <div className="space-y-2">
            <Label htmlFor="session-agenda">Agenda</Label>
            <Textarea
              id="session-agenda"
              value={agenda}
              onChange={event => setAgenda(event.target.value)}
              rows={4}
              maxLength={5000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-recap">Recap</Label>
            <Textarea
              id="session-recap"
              value={recap}
              onChange={event => setRecap(event.target.value)}
              rows={6}
              maxLength={10000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-dm-notes">Private DM Notes</Label>
            <Textarea
              id="session-dm-notes"
              value={dmNotes}
              onChange={event => setDmNotes(event.target.value)}
              rows={6}
              maxLength={10000}
            />
          </div>

          <PublishToggle published={recapPublished} onToggle={async value => setRecapPublished(value)} />

          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-foreground">Attendance</p>
            {membersLoading ? (
              <p className="text-sm text-muted-foreground">Loading members...</p>
            ) : memberOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members found.</p>
            ) : (
              <div className="space-y-2">
                {memberOptions.map(member => (
                  <label key={member.id} className="flex min-h-[44px] items-center gap-2 text-sm">
                    <Checkbox
                      checked={attendance.includes(member.id)}
                      onCheckedChange={checked => handleAttendanceToggle(member.id, checked === true)}
                    />
                    <span className="text-muted-foreground">{member.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <SheetFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting ? 'Saving...' : isEditing ? 'Save Session' : 'Create Session'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
