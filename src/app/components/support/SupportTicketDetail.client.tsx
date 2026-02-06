'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { MessageSquare, Paperclip, ShieldCheck } from 'lucide-react';
import { PageContainer } from '@/app/components/layout/PageContainer';
import PageHero from '@/app/components/shared/PageHero';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import ErrorState from '@/app/components/ui/ErrorState';
import Badge from '@/app/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/app/components/ui/Textarea';
import Feedback from '@/app/components/ui/Feedback';
import AttachmentDropzone, {
  type AttachmentItem,
} from '@/app/components/support/AttachmentDropzone.client';
import { selectIsAuthenticated, selectIsLoading } from '@/store/slices/authSlice';
import { FormattedDate } from '@/app/components/ui/FormattedDate';
import {
  SUPPORT_STATUS_LABELS,
  SUPPORT_STATUS_COLORS,
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_SEVERITY_LABELS,
} from '@/lib/constants/support';
import { DATE_TIME_OPTIONS, UI_CLASSNAMES } from '@/lib/constants/ui';

// User-friendly override: "waiting_user" shows as "Απάντηση από εσένα" for end users
const statusLabels: Record<string, string> = {
  ...SUPPORT_STATUS_LABELS,
  waiting_user: 'Απάντηση από εσένα',
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
};

type TicketMessage = {
  id: string;
  ticket_id: string;
  author_role: string;
  author_user_id: string | null;
  message: string;
  is_internal: boolean;
  created_at: string;
};

type TicketAttachment = {
  id: string;
  ticket_id: string;
  message_id: string | null;
  file_name: string | null;
  mime_type: string;
  size_bytes: number;
  signed_url?: string | null;
};

export default function SupportTicketDetail() {
  const params = useParams();
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authLoading = useSelector(selectIsLoading);
  const ticketId = params?.id as string;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<AttachmentItem[]>([]);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyResult, setReplyResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/pages/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !ticketId) return;

    let ignore = false;

    const loadTicket = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/support/tickets/${ticketId}`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Αποτυχία φόρτωσης ticket');
        }
        if (!ignore) {
          setTicket(payload.data?.ticket ?? null);
          setMessages(payload.data?.messages ?? []);
          setAttachments(payload.data?.attachments ?? []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Κάτι πήγε στραβά');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadTicket();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, ticketId]);

  const attachmentsByMessage = useMemo(() => {
    const map: Record<string, TicketAttachment[]> = {};
    attachments.forEach(item => {
      const key = item.message_id || 'ticket';
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [attachments]);

  const handleReplySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!replyText.trim()) {
      setReplyResult({ type: 'error', message: 'Πρόσθεσε το μήνυμά σου.' });
      return;
    }

    setReplyLoading(true);
    setReplyResult(null);

    try {
      const body = new FormData();
      body.append('message', replyText.trim());
      replyAttachments.forEach(item => body.append('attachments', item.file));

      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        body,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Η αποστολή απέτυχε');
      }

      setReplyText('');
      setReplyAttachments([]);
      setReplyResult({ type: 'success', message: 'Το μήνυμα στάλθηκε.' });

      const refresh = await fetch(`/api/support/tickets/${ticketId}`);
      const refreshPayload = await refresh.json();
      if (refresh.ok) {
        setTicket(refreshPayload.data?.ticket ?? null);
        setMessages(refreshPayload.data?.messages ?? []);
        setAttachments(refreshPayload.data?.attachments ?? []);
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

  if (!isAuthenticated && authLoading) {
    return (
      <div className="py-20">
        <LoadingSpinner label="Φορτώνουμε..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
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
    <div className={UI_CLASSNAMES.pageShell}>
      <div className={UI_CLASSNAMES.pageBackdrop}>
        <div className={UI_CLASSNAMES.pageGradient} />
      </div>
      <div className="relative">
        <PageHero
          eyebrow="Υποστήριξη"
          title={
            <span className="text-3xl text-[var(--hb-headline)] md:text-5xl">{ticket.subject}</span>
          }
          subtitle={`Κατηγορία: ${SUPPORT_CATEGORY_LABELS[ticket.category] || ticket.category}`}
          badges={
            <>
              <Badge
                text={statusLabels[ticket.status] || ticket.status}
                color={SUPPORT_STATUS_COLORS[ticket.status] || 'gray'}
              />
              {ticket.severity ? (
                <span className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1 text-xs">
                  Σοβαρότητα: {SUPPORT_SEVERITY_LABELS[ticket.severity] || ticket.severity}
                </span>
              ) : null}
            </>
          }
        />

        <PageContainer size="md" className="pb-20">
          <Card className={UI_CLASSNAMES.panelCard}>
            <CardHeader className="border-[var(--hb-border)]">
              <CardTitle className="flex items-center gap-2 text-[var(--hb-headline)]">
                <MessageSquare className="h-5 w-5 text-[var(--hb-primary)]" />
                Ιστορικό συνομιλίας
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`rounded-2xl border p-4 ${
                    message.author_role === 'admin'
                      ? 'border-[var(--hb-primary-strong)]/40 bg-[var(--hb-card)]'
                      : 'border-[var(--hb-border)] bg-[var(--hb-panel)]'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between text-xs text-[var(--hb-muted)]">
                    <span className="flex items-center gap-2">
                      {message.author_role === 'admin' ? (
                        <ShieldCheck className="h-4 w-4 text-[var(--hb-primary)]" />
                      ) : null}
                      {message.author_role === 'admin' ? 'Ομάδα υποστήριξης' : 'Εσύ'}
                    </span>
                    <FormattedDate
                      date={message.created_at}
                      options={DATE_TIME_OPTIONS}
                      fallback=""
                      className="text-xs"
                    />
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
                onSubmit={handleReplySubmit}
                className="space-y-4 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4"
              >
                <div className="text-sm font-semibold text-[var(--hb-headline)]">
                  Απάντησε στο ticket
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
                <AttachmentDropzone
                  items={replyAttachments}
                  onChange={setReplyAttachments}
                  disabled={replyLoading}
                />
                <Button type="submit" variant="primary" disabled={replyLoading}>
                  {replyLoading ? 'Αποστολή...' : 'Αποστολή απάντησης'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    </div>
  );
}
