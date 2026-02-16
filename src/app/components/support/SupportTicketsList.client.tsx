'use client';

import { useMemo, useState } from 'react';
import { PageContainer } from '@/app/components/layout/PageContainer';
import PageHero from '@/app/components/shared/PageHero';
import { Spinner } from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty';
import { Alert, AlertDescription, ErrorAlert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SelectField as Select } from '@/components/ui/select-field';
import { Inbox, X } from 'lucide-react';
import SupportTicketCard from '@/app/components/support/SupportTicketCard.client';
// Middleware ensures only authenticated users reach this page
import { useTickets } from '@/lib/hooks/useTickets';
import {
  SUPPORT_STATUS_LABELS,
  SUPPORT_STATUS_COLORS,
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_SEVERITY_LABELS,
} from '@/lib/constants/support';
import { UI_CLASSNAMES } from '@/lib/constants/ui';
import type { TicketsAlert } from '@/lib/hooks/useTickets';

const statusLabels: Record<string, string> = {
  ...SUPPORT_STATUS_LABELS,
  open: 'Open',
  in_progress: 'In progress',
  waiting_user: 'Awaiting your response',
  resolved: 'Resolved',
  closed: 'Closed',
};

const categoryLabels: Record<string, string> = {
  ...SUPPORT_CATEGORY_LABELS,
  bug: 'Bug',
  feature: 'Feature request',
  author_rights: 'Author rights',
  general: 'General',
};

const severityLabels: Record<string, string> = {
  ...SUPPORT_SEVERITY_LABELS,
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

type TicketItem = {
  id: string;
  category: string;
  subject: string;
  status: string;
  severity: string | null;
  created_at: string;
  updated_at: string;
  user_archived?: boolean;
};

const mapAlertVariant = (type: TicketsAlert['type']) => (type === 'error' ? 'destructive' : type);

export default function SupportTicketsList() {
  const {
    tickets,
    setTickets,
    loading,
    error,
    actionLoading,
    setActionLoading,
    alert,
    setAlert,
    reload,
  } = useTickets<TicketItem>({
    endpoint: '/api/support/tickets',
    enabled: true,
  });
  const [view, setView] = useState<'active' | 'all' | 'archive'>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const handleArchiveToggle = async (id: string, archived: boolean) => {
    if (actionLoading) return;
    setActionLoading(id);
    try {
      const response = await fetch(`/api/support/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: archived ? 'archive' : 'unarchive' }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update ticket');
      }
      setTickets(prev => prev.map(t => (t.id === id ? { ...t, user_archived: archived } : t)));
    } catch (err) {
      console.error(err);
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const performDelete = async (id: string) => {
    if (actionLoading) return;
    setActionLoading(id);
    try {
      const response = await fetch(`/api/support/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to remove ticket');
      }
      setTickets(prev => prev.filter(t => t.id !== id));
      setAlert({ type: 'success', message: 'The ticket was removed from your view.' });
    } catch (err) {
      console.error(err);
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (id: string) => {
    setAlert({
      type: 'warning',
      message: 'Remove this ticket from your view? (Admins can still see it.)',
      onConfirm: () => {
        setAlert(null);
        performDelete(id);
      },
      onCancel: () => {
        setAlert(null);
      },
    });
  };

  const filteredTickets = useMemo(() => {
    const activeStatuses = ['open', 'in_progress', 'waiting_user'];
    const archivedStatuses = ['resolved', 'closed'];
    return tickets
      .filter(ticket => {
        const archivedFlag = ticket.user_archived === true;
        if (view === 'active') return activeStatuses.includes(ticket.status) && !archivedFlag;
        if (view === 'archive') return archivedFlag || archivedStatuses.includes(ticket.status);
        return !archivedFlag;
      })
      .filter(ticket => (categoryFilter ? ticket.category === categoryFilter : true));
  }, [tickets, view, categoryFilter]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="py-20">
          <div className="flex flex-col items-center justify-center gap-3">
            <Spinner />
            <span className="text-sm text-muted-foreground">Loading tickets...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return <ErrorAlert message={error} onRetry={reload} />;
    }

    if (filteredTickets.length === 0) {
      return (
        <EmptyState
          icon={<Inbox className="size-5 text-muted-foreground" />}
          title="No tickets yet"
          description="When you submit a support request, it will appear here."
          action={
            <Button href="/pages/support" variant="primary">
              Create a request
            </Button>
          }
        />
      );
    }

    return (
      <div className="space-y-6">
        {filteredTickets.map(ticket => (
          <SupportTicketCard
            key={ticket.id}
            subject={ticket.subject}
            statusText={statusLabels[ticket.status] || ticket.status}
            statusColor={SUPPORT_STATUS_COLORS[ticket.status] || 'gray'}
            categoryText={categoryLabels[ticket.category] || ticket.category}
            severityText={
              ticket.severity ? `Severity: ${severityLabels[ticket.severity] || ticket.severity}` : null
            }
            updatedAt={ticket.updated_at}
            updatedLabel="Last updated"
            titleIcon={<span className="h-2 w-2 rounded-full bg-primary/50" aria-hidden />}
            actions={
              <div className="flex items-center gap-3 pt-2">
                <Button href={`/pages/support/tickets/${ticket.id}`} variant="primary" size="sm">
                  View details
                </Button>
                {view === 'archive' ? (
                  <Button
                    variant="ghost"
                    onClick={() => handleArchiveToggle(ticket.id, false)}
                    className={UI_CLASSNAMES.mutedInteractive}
                    disabled={actionLoading === ticket.id}
                    size="sm"
                  >
                    Restore
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => handleArchiveToggle(ticket.id, true)}
                    className={UI_CLASSNAMES.mutedInteractive}
                    disabled={actionLoading === ticket.id}
                    size="sm"
                  >
                    Move to archive
                  </Button>
                )}
                {view === 'archive' && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(ticket.id)}
                    className="text-foreground"
                    disabled={actionLoading === ticket.id}
                    size="sm"
                  >
                    Delete
                  </Button>
                )}
              </div>
            }
          />
        ))}
      </div>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTickets, loading, error, view]);

  return (
    <div className={UI_CLASSNAMES.pageShell}>
      <div className={UI_CLASSNAMES.pageBackdrop}>
        <div className={UI_CLASSNAMES.pageGradient} />
      </div>
      <div className="relative">
        <PageHero
          eyebrow={null}
          title={
            <span className="flex flex-col items-center gap-3">
              <Badge variant="secondary">Support</Badge>
              <span className="text-3xl font-semibold text-foreground md:text-5xl">My tickets</span>
            </span>
          }
          subtitle="Track your support requests and their status."
          sectionClassName="pt-3 md:pt-4"
          subtitleClassName="mb-6 max-w-2xl text-base text-muted-foreground md:mb-8 md:text-lg"
        />
        <PageContainer size="md" className="pb-20">
          <div className="mx-auto max-w-4xl">
            {alert && (
              <div className="mb-4">
                <Alert variant={mapAlertVariant(alert.type)} className="relative pr-12">
                  <div className="flex flex-col gap-2">
                    <AlertDescription>{alert.message}</AlertDescription>
                    {(alert.onConfirm || alert.onCancel) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {alert.onConfirm && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={alert.onConfirm}
                            className="font-medium"
                          >
                            Delete
                          </Button>
                        )}
                        {alert.onCancel && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              alert.onCancel?.();
                              setAlert(null);
                            }}
                            className="font-medium"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-3 h-8 w-8 rounded-full p-0 text-muted-foreground hover:text-foreground"
                    aria-label="Close alert"
                    onClick={() => setAlert(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Alert>
              </div>
            )}

            <div className="mb-6 rounded-xl border border-border/30 bg-muted/20 p-4 md:flex md:items-center md:justify-between">
              <Tabs value={view} onValueChange={value => setView(value as typeof view)} className="w-full md:w-auto">
                <TabsList className="h-10 w-full flex-wrap gap-2 rounded-xl border border-border/30 bg-card p-1 md:w-auto">
                  {[
                    { value: 'active', label: 'Active' },
                    { value: 'all', label: 'All' },
                    { value: 'archive', label: 'Archived' },
                  ].map(option => (
                    <TabsTrigger
                      key={option.value}
                      value={option.value}
                      className="h-8 rounded-lg px-4 text-sm font-medium"
                    >
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="mt-3 md:mt-0 md:w-64">
                <Select
                  options={['', 'bug', 'feature', 'author_rights', 'general']}
                  optionLabels={{
                    '': 'Category',
                    bug: 'Bug',
                    feature: 'Feature request',
                    author_rights: 'Author rights',
                    general: 'General',
                  }}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  className="h-10"
                  placeholder="Category"
                />
              </div>
            </div>

            {content}

            <div className="mt-8 flex justify-center md:justify-end">
              <Button href="/pages/support" variant="primary" size="lg">
                Create new request
              </Button>
            </div>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}

