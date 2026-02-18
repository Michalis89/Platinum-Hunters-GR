'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ClipboardList, Paperclip, ShieldCheck, Tag, UserCheck } from 'lucide-react';
import { PageContainer } from '@/app/components/layout/PageContainer';
import PageHero from '@/app/components/shared/PageHero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SelectField as Select } from '@/components/ui/select-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle, ErrorAlert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AttachmentDropzone, {
  type AttachmentItem,
} from '@/app/components/support/AttachmentDropzone.client';
import { selectUser } from '@/store/slices/authSlice';
import { hasAnyRole } from '@/lib/roles';
import { FormattedDate } from '@/utils/components/FormattedDate';
import {
  SUPPORT_STATUS_OPTIONS,
  SUPPORT_STATUS_LABELS,
  SUPPORT_STATUS_COLORS,
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_SEVERITY_LABELS,
} from '@/lib/constants/support';
import { DATE_TIME_OPTIONS, UI_CLASSNAMES } from '@/lib/constants/ui';

type TicketDetail = {
  id: string;
  category: string;
  subject: string;
  status: string;
  severity: string | null;
  created_at: string;
  updated_at: string;
  description: string;
  assigned_to: string | null;
  labels: string[] | null;
};

type TicketMessage = {
  id: string;
  author_role: string;
  message: string;
  is_internal: boolean;
  created_at: string;
};

type TicketAttachment = {
  id: string;
  message_id: string | null;
  file_name: string | null;
  signed_url?: string | null;
};

type TicketEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export default function AdminSupportTicketDetail() {
  const params = useParams();
  const router = useRouter();
  const user = useSelector(selectUser);
  const isAdmin = hasAnyRole(user, ['admin', 'owner', 'moderator']);
  const ticketId = params?.id as string;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState('');
  const [labels, setLabels] = useState('');
  const [assignToMe, setAssignToMe] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [replyText, setReplyText] = useState('');
  const [replyInternal, setReplyInternal] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState<AttachmentItem[]>([]);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyResult, setReplyResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    let ignore = false;

    const loadTicket = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/support/tickets/${ticketId}`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load');
        }
        if (!ignore) {
          setTicket(payload.data?.ticket ?? null);
          setMessages(payload.data?.messages ?? []);
          setAttachments(payload.data?.attachments ?? []);
          setEvents(payload.data?.events ?? []);

          const nextStatus = payload.data?.ticket?.status ?? 'open';
          setStatus(nextStatus);
          const nextLabels = Array.isArray(payload.data?.ticket?.labels)
            ? payload.data.ticket.labels.join(', ')
            : '';
          setLabels(nextLabels);
          setAssignToMe(payload.data?.ticket?.assigned_to === user?.id);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Something went wrong');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    if (ticketId) {
      loadTicket();
    }

    return () => {
      ignore = true;
    };
  }, [isAdmin, ticketId, user?.id]);

  const attachmentsByMessage = useMemo(() => {
    const map: Record<string, TicketAttachment[]> = {};
    attachments.forEach(item => {
      const key = item.message_id || 'ticket';
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(item);
    });
    return map;
  }, [attachments]);

  const handleSave = async () => {
    if (!ticket) {
      return;
    }
    setSaving(true);
    setSaveResult(null);

    try {
      const payload = {
        status,
        assigned_to: assignToMe ? user?.id : null,
        labels: labels
          .split(',')
          .map(item => item.trim())
          .filter(Boolean),
      };

      const response = await fetch(`/api/admin/support/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Save failed');
      }

      setTicket(data.data?.ticket ?? ticket);
      setSaveResult({ type: 'success', message: 'Changes saved.' });
    } catch (err) {
      setSaveResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!replyText.trim()) {
      setReplyResult({ type: 'error', message: 'Add a message.' });
      return;
    }

    setReplyLoading(true);
    setReplyResult(null);

    try {
      const body = new FormData();
      body.append('message', replyText.trim());
      body.append('is_internal', String(replyInternal));
      replyAttachments.forEach(item => body.append('attachments', item.file));

      const response = await fetch(`/api/admin/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        body,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Send failed');
      }

      setReplyText('');
      setReplyAttachments([]);
      setReplyInternal(false);
      setReplyResult({
        type: 'success',
        message: replyInternal ? 'Note added.' : 'Reply sent.',
      });

      const refresh = await fetch(`/api/admin/support/tickets/${ticketId}`);
      const refreshPayload = await refresh.json();
      if (refresh.ok) {
        setTicket(refreshPayload.data?.ticket ?? null);
        setMessages(refreshPayload.data?.messages ?? []);
        setAttachments(refreshPayload.data?.attachments ?? []);
        setEvents(refreshPayload.data?.events ?? []);
      }
    } catch (err) {
      setReplyResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setReplyLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <PageContainer size="lg" className="py-20">
        <ErrorAlert message="You do not have access to this page." />
        <div className="mt-6 flex justify-center">
          <Button variant={'link'} onClick={() => router.push('/')}>
            Back to home
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <div className="py-20">
        <div className="flex flex-col items-center justify-center gap-3">
          <Spinner />
          <span className="text-sm text-muted-foreground">Loading ticket...</span>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return <ErrorAlert message={error || 'Ticket not found'} />;
  }

  return (
    <div className={UI_CLASSNAMES.pageShell}>
      <div className={UI_CLASSNAMES.pageBackdrop}>
        <div className={UI_CLASSNAMES.pageGradient} />
      </div>
      <div className="relative">
        <PageHero
          eyebrow="Management"
          title={<span className="text-3xl text-foreground md:text-5xl">{ticket.subject}</span>}
          subtitle={`Category: ${SUPPORT_CATEGORY_LABELS[ticket.category] || ticket.category}`}
          badges={
            <>
              <Badge
                variant={
                  SUPPORT_STATUS_COLORS[ticket.status] === 'green'
                    ? 'default'
                    : SUPPORT_STATUS_COLORS[ticket.status] === 'blue'
                      ? 'default'
                      : SUPPORT_STATUS_COLORS[ticket.status] === 'yellow'
                        ? 'outline'
                        : 'secondary'
                }
              >
                {SUPPORT_STATUS_LABELS[ticket.status] || ticket.status}
              </Badge>
              {ticket.severity ? (
                <span className="rounded-full border border-border bg-card px-3 py-1 text-xs">
                  Severity: {SUPPORT_SEVERITY_LABELS[ticket.severity] || ticket.severity}
                </span>
              ) : null}
            </>
          }
        />

        <PageContainer size="full" className="pb-20">
          <div className="mb-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => router.push('/admin/support')}>
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (deleteLoading) {
                  return;
                }
                const confirmed = window.confirm('Permanently delete this ticket?');
                if (!confirmed) {
                  return;
                }
                setDeleteLoading(true);
                try {
                  const res = await fetch(`/api/admin/support/tickets/${ticket.id}`, {
                    method: 'DELETE',
                  });
                  const payload = await res.json().catch(() => null);
                  if (!res.ok) {
                    throw new Error(payload?.error || 'Deletion failed');
                  }
                  router.push('/admin/support');
                } catch (err) {
                  setReplyResult({
                    type: 'error',
                    message: err instanceof Error ? err.message : 'Delete error',
                  });
                } finally {
                  setDeleteLoading(false);
                }
              }}
              disabled={deleteLoading}
            >
              Delete
            </Button>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className={UI_CLASSNAMES.panelCard}>
              <CardHeader className="border-border">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Conversation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`rounded-2xl border p-4 ${
                      message.is_internal
                        ? 'border-amber-500/40 bg-warning/10'
                        : message.author_role === 'admin'
                          ? 'border-primary/40 bg-card'
                          : 'border-border bg-card'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        {message.author_role === 'admin' ? (
                          <ShieldCheck className="h-4 w-4 text-primary" />
                        ) : null}
                        {message.is_internal
                          ? 'Internal note'
                          : message.author_role === 'admin'
                            ? 'Admin'
                            : 'User'}
                      </span>
                      <FormattedDate
                        date={message.created_at}
                        options={DATE_TIME_OPTIONS}
                        fallback=""
                        className="text-xs"
                      />
                    </div>
                    <p className="whitespace-pre-line text-sm text-foreground">{message.message}</p>

                    {attachmentsByMessage[message.id]?.length ? (
                      <div className="mt-3 space-y-2">
                        {attachmentsByMessage[message.id].map(attachment => (
                          <a
                            key={attachment.id}
                            href={attachment.signed_url ?? '#'}
                            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground hover:border-primary"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            {attachment.file_name || 'Attachment'}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}

                <form
                  onSubmit={handleReply}
                  className="space-y-4 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="text-sm font-semibold text-foreground">Reply / Note</div>
                  {replyResult ? (
                    <Alert
                      variant={replyResult.type === 'success' ? 'success' : 'destructive'}
                      className="rounded-xl border border-border bg-card/80 px-4 py-3"
                    >
                      <AlertTitle className="text-base">
                        {replyResult.type === 'success' ? 'OK' : 'Error'}
                      </AlertTitle>
                      <AlertDescription>{replyResult.message}</AlertDescription>
                    </Alert>
                  ) : null}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Message</label>
                    <Textarea
                      value={replyText}
                      onChange={event => setReplyText(event.target.value)}
                      rows={3}
                      disabled={replyLoading}
                    />
                  </div>
                  <label className="flex items-start justify-between gap-4">
                    <span className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-[var(--hb-headline)]">
                        Internal note
                      </span>
                      <span className="text-xs text-[var(--hb-muted)]">
                        The user will not see it.
                      </span>
                    </span>
                    <Switch
                      checked={replyInternal}
                      onCheckedChange={value => setReplyInternal(value)}
                    />
                  </label>
                  <AttachmentDropzone
                    items={replyAttachments}
                    onChange={setReplyAttachments}
                    disabled={replyLoading}
                  />
                  <Button type="submit" variant="primary" disabled={replyLoading}>
                    {replyLoading ? 'Sending...' : replyInternal ? 'Add note' : 'Send reply'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-10 space-y-6">
              <Card className={UI_CLASSNAMES.panelCard}>
                <CardHeader className="border-border">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <UserCheck className="h-5 w-5 text-primary" />
                    Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {saveResult ? (
                    <Alert
                      variant={saveResult.type === 'success' ? 'success' : 'destructive'}
                      className="rounded-xl border border-border bg-card/80 px-4 py-3"
                    >
                      <AlertTitle className="text-base">
                        {saveResult.type === 'success' ? 'OK' : 'Error'}
                      </AlertTitle>
                      <AlertDescription>{saveResult.message}</AlertDescription>
                    </Alert>
                  ) : null}
                  <Select
                    label="Status"
                    value={status}
                    onChange={value => setStatus(value)}
                    options={SUPPORT_STATUS_OPTIONS}
                    optionLabels={SUPPORT_STATUS_LABELS}
                    placeholder="Select"
                    labelClassName="text-foreground"
                    className="border-border bg-card text-foreground"
                  />
                  <label className="flex items-start justify-between gap-4">
                    <span className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-[var(--hb-headline)]">
                        Assign to me
                      </span>
                      <span className="text-xs text-[var(--hb-muted)]">
                        The ticket will appear as assigned to your account.
                      </span>
                    </span>
                    <Switch checked={assignToMe} onCheckedChange={value => setAssignToMe(value)} />
                  </label>
                  <div>
                    <Input
                      label="Labels"
                      type="text"
                      value={labels}
                      onChange={event => setLabels(event.target.value)}
                      placeholder="e.g. billing, ux"
                      className="border-border bg-card"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">Separate with commas.</div>
                  </div>
                  <Button type="button" variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save changes'}
                  </Button>
                </CardContent>
              </Card>

              <Card className={UI_CLASSNAMES.panelCard}>
                <CardHeader className="border-border">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Tag className="h-5 w-5 text-primary" />
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {events.length === 0 ? (
                    <p>No events yet.</p>
                  ) : (
                    events.map(event => (
                      <div key={event.id} className="rounded-xl border border-border bg-card p-3">
                        <div className="text-xs uppercase text-muted-foreground">{event.type}</div>
                        <div className="text-xs text-muted-foreground">
                          <FormattedDate
                            date={event.created_at}
                            options={DATE_TIME_OPTIONS}
                            fallback=""
                            className="text-xs"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
