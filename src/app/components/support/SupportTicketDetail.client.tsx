'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageContainer } from '@/app/components/layout/PageContainer';
import PageHero from '@/app/components/shared/PageHero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle, ErrorAlert } from '@/components/ui/alert';
import AttachmentDropzone, {
  type AttachmentItem,
} from '@/app/components/support/AttachmentDropzone.client';
// Middleware ensures only authenticated users reach this page
import { FormattedDate } from '@/utils/components/FormattedDate';
import {
  SUPPORT_STATUS_LABELS,
  SUPPORT_STATUS_COLORS,
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_SEVERITY_LABELS,
} from '@/lib/constants/support';
import { DATE_TIME_OPTIONS, UI_CLASSNAMES } from '@/lib/constants/ui';

const statusLabels: Record<string, string> = {
  ...SUPPORT_STATUS_LABELS,
  waiting_user: 'Reply from you',
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
    if (!ticketId) {return;}

    let ignore = false;

    const loadTicket = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/support/tickets/${ticketId}`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load ticket');
        }
        if (!ignore) {
          setTicket(payload.data?.ticket ?? null);
          setMessages(payload.data?.messages ?? []);
          setAttachments(payload.data?.attachments ?? []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Something went wrong');
        }
      } finally {
        if (!ignore) {setLoading(false);}
      }
    };

    loadTicket();
    return () => {
      ignore = true;
    };
  }, [ticketId]);

  const attachmentsByMessage = useMemo(() => {
    const map: Record<string, TicketAttachment[]> = {};
    attachments.forEach(item => {
      const key = item.message_id || 'ticket';
      if (!map[key]) {map[key] = [];}
      map[key].push(item);
    });
    return map;
  }, [attachments]);

  const handleReplySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!replyText.trim()) {
      setReplyResult({ type: 'error', message: 'Add your message.' });
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
        throw new Error(payload.error || 'Sending failed');
      }

      setReplyText('');
      setReplyAttachments([]);
      setReplyResult({ type: 'success', message: 'Message sent.' });

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
        message: err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setReplyLoading(false);
    }
  };

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
          eyebrow="Support"
          title={
            <span className="text-3xl font-semibold text-foreground md:text-5xl">
              {ticket.subject}
            </span>
          }
          subtitle={`Category: ${SUPPORT_CATEGORY_LABELS[ticket.category] || ticket.category}`}
          sectionClassName=" pt-4"
          subtitleClassName=" text-muted-foreground"
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
                {statusLabels[ticket.status] || ticket.status}
              </Badge>
              {ticket.severity ? (
                <span className="rounded-full px-3 py-1 text-xs text-muted-foreground">
                  Severity: {SUPPORT_SEVERITY_LABELS[ticket.severity] || ticket.severity}
                </span>
              ) : null}
            </>
          }
        />

        <PageContainer size="md" className="pb-20">
          <Card className={`${UI_CLASSNAMES.panelCard} `}>
            <CardHeader className="bg-transparent">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
                Conversation history
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`rounded-lg border p-4 ${
                    message.author_role === 'admin' ? 'border-primary/35 bg-primary/10' : 'bg-card'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          message.author_role === 'admin'
                            ? 'bg-accent'
                            : 'bg-[hsl(var(--muted-foreground))]'
                        }`}
                        aria-hidden
                      />
                      {message.author_role === 'admin' ? 'Support team' : 'You'}
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
                          className="flex items-center gap-2 px-3 py-2 text-xs text-foreground transition hover:border-info"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--muted-foreground))]"
                            aria-hidden
                          />
                          {attachment.file_name || 'Attachment'}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              <form onSubmit={handleReplySubmit} className="space-y-4 rounded-lg p-4">
                <div className="text-sm font-semibold text-foreground">Reply to ticket</div>
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
                <AttachmentDropzone
                  items={replyAttachments}
                  onChange={setReplyAttachments}
                  disabled={replyLoading}
                />
                <Button type="submit" variant="primary" disabled={replyLoading}>
                  {replyLoading ? 'Sending...' : 'Send reply'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    </div>
  );
}
