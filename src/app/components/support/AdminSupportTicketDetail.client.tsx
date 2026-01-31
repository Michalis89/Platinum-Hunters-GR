'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ClipboardList, Paperclip, ShieldCheck, Tag, UserCheck } from 'lucide-react';
import { PageContainer } from '@/app/components/layout/PageContainer';
import PageHero from '@/app/components/shared/PageHero';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Select } from '@/app/components/ui/Select';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/Textarea';
import { Switch } from '@/app/components/ui/Switch';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import ErrorState from '@/app/components/ui/ErrorState';
import Feedback from '@/app/components/ui/Feedback';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import AttachmentDropzone, {
  type AttachmentItem,
} from '@/app/components/support/AttachmentDropzone.client';
import { selectUser } from '@/store/slices/authSlice';
import { hasAnyRole } from '@/lib/roles';

const STATUS_OPTIONS = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed'];
const statusLabels: Record<string, string> = {
  open: 'Ανοικτό',
  in_progress: 'Σε εξέλιξη',
  waiting_user: 'Αναμένει χρήστη',
  resolved: 'Επιλύθηκε',
  closed: 'Κλειστό',
};

const statusColors: Record<string, string> = {
  open: 'blue',
  in_progress: 'yellow',
  waiting_user: 'yellow',
  resolved: 'green',
  closed: 'gray',
};

const categoryLabels: Record<string, string> = {
  bug: 'Σφάλμα',
  feature: 'Πρόταση',
  author_rights: 'Δικαιώματα Author',
  general: 'Γενικά',
};

const severityLabels: Record<string, string> = {
  low: 'Χαμηλή',
  medium: 'Μεσαία',
  high: 'Υψηλή',
  critical: 'Κρίσιμη',
};

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
          throw new Error(payload.error || 'Αποτυχία φόρτωσης');
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
          setError(err instanceof Error ? err.message : 'Κάτι πήγε στραβά');
        }
      } finally {
        if (!ignore) setLoading(false);
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
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [attachments]);

  const handleSave = async () => {
    if (!ticket) return;
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
        throw new Error(data.error || 'Αποτυχία αποθήκευσης');
      }

      setTicket(data.data?.ticket ?? ticket);
      setSaveResult({ type: 'success', message: 'Οι αλλαγές αποθηκεύτηκαν.' });
    } catch (err) {
      setSaveResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Κάτι πήγε στραβά',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!replyText.trim()) {
      setReplyResult({ type: 'error', message: 'Πρόσθεσε μήνυμα.' });
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
        throw new Error(payload.error || 'Αποτυχία αποστολής');
      }

      setReplyText('');
      setReplyAttachments([]);
      setReplyInternal(false);
      setReplyResult({
        type: 'success',
        message: replyInternal ? 'Σημείωση προστέθηκε.' : 'Η απάντηση στάλθηκε.',
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
        message: err instanceof Error ? err.message : 'Κάτι πήγε στραβά',
      });
    } finally {
      setReplyLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <PageContainer size="md" className="py-20">
        <ErrorState error="Δεν έχεις πρόσβαση σε αυτή τη σελίδα." />
        <div className="mt-6 flex justify-center">
          <Button onClick={() => router.push('/')}>Επιστροφή στην αρχική</Button>
        </div>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner label="Φορτώνουμε το ticket..." />
      </div>
    );
  }

  if (error || !ticket) {
    return <ErrorState error={error || 'Το ticket δεν βρέθηκε'} />;
  }

  return (
    <div className="relative min-h-screen bg-[var(--hb-bg)] text-[var(--hb-text)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
        <div className="absolute inset-0 bg-[var(--hb-gradient)] blur-[100px]" />
      </div>
      <div className="relative">
        <PageHero
          eyebrow="Διαχείριση"
          title={
            <span className="text-3xl text-[var(--hb-headline)] md:text-5xl">{ticket.subject}</span>
          }
          subtitle={`Κατηγορία: ${categoryLabels[ticket.category] || ticket.category}`}
          badges={
            <>
              <Badge
                text={statusLabels[ticket.status] || ticket.status}
                color={statusColors[ticket.status] || 'gray'}
              />
              {ticket.severity ? (
                <span className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1 text-xs">
                  Σοβαρότητα: {severityLabels[ticket.severity] || ticket.severity}
                </span>
              ) : null}
            </>
          }
        />

        <PageContainer size="lg" className="pb-20">
          <div className="mb-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => router.push('/admin/support')}>
              Πίσω
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (deleteLoading) return;
                const confirmed = window.confirm('Οριστική διαγραφή αυτού του ticket;');
                if (!confirmed) return;
                setDeleteLoading(true);
                try {
                  const res = await fetch(`/api/admin/support/tickets/${ticket.id}`, {
                    method: 'DELETE',
                  });
                  const payload = await res.json().catch(() => null);
                  if (!res.ok) {
                    throw new Error(payload?.error || 'Αποτυχία διαγραφής');
                  }
                  router.push('/admin/support');
                } catch (err) {
                  setReplyResult({
                    type: 'error',
                    message: err instanceof Error ? err.message : 'Σφάλμα διαγραφής',
                  });
                } finally {
                  setDeleteLoading(false);
                }
              }}
              disabled={deleteLoading}
            >
              Διαγραφή
            </Button>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[var(--hb-shadow-md)]">
              <CardHeader className="border-[var(--hb-border)]">
                <CardTitle className="flex items-center gap-2 text-[var(--hb-headline)]">
                  <ClipboardList className="h-5 w-5 text-[var(--hb-primary)]" />
                  Συνομιλία
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`rounded-2xl border p-4 ${
                      message.is_internal
                        ? 'border-amber-500/40 bg-amber-500/10'
                        : message.author_role === 'admin'
                          ? 'border-[var(--hb-primary-strong)]/40 bg-[var(--hb-card)]'
                          : 'border-[var(--hb-border)] bg-[var(--hb-panel)]'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between text-xs text-[var(--hb-muted)]">
                      <span className="flex items-center gap-2">
                        {message.author_role === 'admin' ? (
                          <ShieldCheck className="h-4 w-4 text-[var(--hb-primary)]" />
                        ) : null}
                        {message.is_internal
                          ? 'Εσωτερική σημείωση'
                          : message.author_role === 'admin'
                            ? 'Διαχειριστής'
                            : 'Χρήστης'}
                      </span>
                      <span>{new Date(message.created_at).toLocaleString('el-GR')}</span>
                    </div>
                    <p className="whitespace-pre-line text-sm text-[var(--hb-text)]">
                      {message.message}
                    </p>

                    {attachmentsByMessage[message.id]?.length ? (
                      <div className="mt-3 space-y-2">
                        {attachmentsByMessage[message.id].map(attachment => (
                          <a
                            key={attachment.id}
                            href={attachment.signed_url ?? '#'}
                            className="flex items-center gap-2 rounded-lg border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-2 text-xs text-[var(--hb-text)] hover:border-[var(--hb-primary-strong)]"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Paperclip className="h-4 w-4 text-[var(--hb-muted)]" />
                            {attachment.file_name || 'Συνημμένο'}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}

                <form
                  onSubmit={handleReply}
                  className="space-y-4 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4"
                >
                  <div className="text-sm font-semibold text-[var(--hb-headline)]">
                    Απάντηση / Σημείωση
                  </div>
                  {replyResult ? (
                    <Feedback
                      variant={replyResult.type === 'success' ? 'success' : 'error'}
                      tone={replyResult.type === 'success' ? 'solid' : 'soft'}
                      title={replyResult.type === 'success' ? 'ΟΚ' : 'Σφάλμα'}
                      description={replyResult.message}
                    />
                  ) : null}
                  <Textarea
                    label="Μήνυμα"
                    value={replyText}
                    onChange={event => setReplyText(event.target.value)}
                    rows={3}
                    disabled={replyLoading}
                  />
                  <Switch
                    label="Εσωτερική σημείωση"
                    description="Ο χρήστης δεν θα τη δει."
                    checked={replyInternal}
                    onChange={event => setReplyInternal(event.target.checked)}
                  />
                  <AttachmentDropzone
                    items={replyAttachments}
                    onChange={setReplyAttachments}
                    disabled={replyLoading}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={replyLoading}
                    className="bg-[var(--hb-primary-strong)] text-white"
                  >
                    {replyLoading
                      ? 'Αποστολή...'
                      : replyInternal
                        ? 'Προσθήκη σημείωσης'
                        : 'Αποστολή απάντησης'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-10 space-y-6">
              <Card className="border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[var(--hb-shadow-md)]">
                <CardHeader className="border-[var(--hb-border)]">
                  <CardTitle className="flex items-center gap-2 text-[var(--hb-headline)]">
                    <UserCheck className="h-5 w-5 text-[var(--hb-primary)]" />
                    Διαχείριση
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {saveResult ? (
                    <Feedback
                      variant={saveResult.type === 'success' ? 'success' : 'error'}
                      tone={saveResult.type === 'success' ? 'solid' : 'soft'}
                      title={saveResult.type === 'success' ? 'ΟΚ' : 'Σφάλμα'}
                      description={saveResult.message}
                    />
                  ) : null}
                  <Select
                    label="Κατάσταση"
                    value={status}
                    onChange={value => setStatus(value)}
                    options={STATUS_OPTIONS}
                    optionLabels={statusLabels}
                    placeholder="Επίλεξε"
                    labelClassName="text-[var(--hb-headline)]"
                    className="border-[var(--hb-border)] bg-[var(--hb-panel)] text-[var(--hb-text)]"
                  />
                  <Switch
                    label="Ανάθεση σε μένα"
                    description="Το ticket θα εμφανίζεται ως assigned στον λογαριασμό σου."
                    checked={assignToMe}
                    onChange={event => setAssignToMe(event.target.checked)}
                  />
                  <div>
                    <Input
                      label="Labels"
                      type="text"
                      value={labels}
                      onChange={event => setLabels(event.target.value)}
                      placeholder="π.χ. billing, ux"
                      className="border-[var(--hb-border)] bg-[var(--hb-card)]"
                    />
                    <div className="mt-2 text-xs text-[var(--hb-muted)]">Χώρισε με κόμμα.</div>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    className="bg-[var(--hb-primary-strong)] text-white"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Αποθήκευση...' : 'Αποθήκευση αλλαγών'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[var(--hb-shadow-md)]">
                <CardHeader className="border-[var(--hb-border)]">
                  <CardTitle className="flex items-center gap-2 text-[var(--hb-headline)]">
                    <Tag className="h-5 w-5 text-[var(--hb-primary)]" />
                    Ενέργειες
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-[var(--hb-muted)]">
                  {events.length === 0 ? (
                    <p>Δεν υπάρχουν ακόμη events.</p>
                  ) : (
                    events.map(event => (
                      <div
                        key={event.id}
                        className="rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3"
                      >
                        <div className="text-xs uppercase text-[var(--hb-muted)]">{event.type}</div>
                        <div className="text-xs text-[var(--hb-muted)]">
                          {new Date(event.created_at).toLocaleString('el-GR')}
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
