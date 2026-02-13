'use client';

import { useMemo, useState } from 'react';
import { PageContainer } from '@/app/components/layout/PageContainer';
import PageHero from '@/app/components/shared/PageHero';
import { Spinner } from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty';
import { Alert, AlertDescription, ErrorAlert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SelectField as Select } from '@/components/ui/select-field';
import { X } from 'lucide-react';
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

// User-facing override for "waiting_user" status
const statusLabels: Record<string, string> = {
  ...SUPPORT_STATUS_LABELS,
  waiting_user: 'Απάντηση από εσένα', // User-friendly version
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

const mapAlertVariant = (type: TicketsAlert['type']) =>
  type === 'error' ? 'destructive' : type;

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
    enabled: true, // Middleware ensures auth
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
        throw new Error(payload?.error || 'Αποτυχία ενημέρωσης');
      }
      setTickets(prev => prev.map(t => (t.id === id ? { ...t, user_archived: archived } : t)));
    } catch (err) {
      console.error(err);
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Σφάλμα',
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
        throw new Error(payload?.error || 'Αποτυχία διαγραφής');
      }
      setTickets(prev => prev.filter(t => t.id !== id));
      setAlert({ type: 'success', message: 'Το ticket αφαιρέθηκε από τη δική σου προβολή.' });
    } catch (err) {
      console.error(err);
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Σφάλμα',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (id: string) => {
    setAlert({
      type: 'warning',
      message: 'Να αφαιρεθεί το ticket από τη δική σου προβολή; (Admins το βλέπουν πάντα)',
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
        // 'all' => all non-archived tickets
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
            <span className="text-sm text-muted-foreground">Φορτώνουμε τα tickets...</span>
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
          icon={
            <span className="text-info flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold">
              0
            </span>
          }
          title={
            view === 'archive'
              ? 'Δεν υπάρχουν αρχειοθετημένα tickets'
              : 'Δεν υπάρχουν tickets για τα φίλτρα που επέλεξες'
          }
          description={
            view === 'archive'
              ? 'Τα κλειστά tickets θα εμφανιστούν εδώ ως ιστορικό.'
              : 'Άλλαξε φίλτρα ή δημιούργησε νέο αίτημα.'
          }
          action={
            <Button href="/pages/support" variant="primary">
              Νέο αίτημα
            </Button>
          }
        />
      );
    }

    return (
      <div className="space-y-4">
        {filteredTickets.map(ticket => (
          <SupportTicketCard
            key={ticket.id}
            subject={ticket.subject}
            statusText={statusLabels[ticket.status] || ticket.status}
            statusColor={SUPPORT_STATUS_COLORS[ticket.status] || 'gray'}
            categoryText={SUPPORT_CATEGORY_LABELS[ticket.category] || ticket.category}
            severityText={
              ticket.severity
                ? `Σοβαρότητα: ${SUPPORT_SEVERITY_LABELS[ticket.severity] || ticket.severity}`
                : null
            }
            updatedAt={ticket.updated_at}
            updatedLabel="Τελευταία ενημέρωση:"
            titleIcon={<span className="bg-info h-2.5 w-2.5 rounded-full" aria-hidden />}
            actions={
              <>
                <Button href={`/pages/support/tickets/${ticket.id}`} variant="secondary">
                  Δες λεπτομέρειες
                </Button>
                {view === 'archive' ? (
                  <Button
                    variant="ghost"
                    onClick={() => handleArchiveToggle(ticket.id, false)}
                    className={UI_CLASSNAMES.mutedInteractive}
                    disabled={actionLoading === ticket.id}
                  >
                    Επαναφορά από αρχείο
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => handleArchiveToggle(ticket.id, true)}
                    className={UI_CLASSNAMES.mutedInteractive}
                    disabled={actionLoading === ticket.id}
                  >
                    Μεταφορά στο αρχείο
                  </Button>
                )}
                {view === 'archive' && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(ticket.id)}
                    className="text-foreground"
                    disabled={actionLoading === ticket.id}
                  >
                    Διαγραφή
                  </Button>
                )}
              </>
            }
          />
        ))}
      </div>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTickets, loading, error, view]);

  // Middleware ensures only authenticated users reach this page

  return (
    <div className={UI_CLASSNAMES.pageShell}>
      <div className={UI_CLASSNAMES.pageBackdrop}>
        <div className={UI_CLASSNAMES.pageGradient} />
      </div>
      <div className="relative">
        <PageHero
          eyebrow="Υποστήριξη"
          title={
            <span className="text-3xl font-semibold text-foreground md:text-5xl">
              Τα tickets μου
            </span>
          }
          subtitle="Δες όλα τα αιτήματα υποστήριξης και την εξέλιξή τους."
          sectionClassName=" pt-4"
          subtitleClassName=" text-muted-foreground"
        />
        <PageContainer size="md" className="pb-20">
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
                          Διαγραφή
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
                          Άκυρο
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
                  aria-label="Κλείσιμο μηνύματος"
                  onClick={() => setAlert(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Alert>
            </div>
          )}
          <div className="mb-6 grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-end">
            <Tabs
              value={view}
              onValueChange={value => setView(value as typeof view)}
              className="w-full"
            >
              <TabsList className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2">
                {[
                  { value: 'active', label: 'Ενεργά' },
                  { value: 'all', label: 'Όλα' },
                  { value: 'archive', label: 'Αρχείο' },
                ].map(option => (
                  <TabsTrigger
                    key={option.value}
                    value={option.value}
                    className="flex flex-1 flex-col items-center justify-center rounded-xl px-4 py-2 text-sm font-medium"
                  >
                    <span>{option.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="md:w-64">
              <Select
                label="Κατηγορία"
                options={['', 'bug', 'feature', 'author_rights', 'general']}
                optionLabels={{
                  '': 'Όλες',
                  bug: 'Σφάλμα',
                  feature: 'Πρόταση',
                  author_rights: 'Author',
                  general: 'Γενικά',
                }}
                value={categoryFilter}
                onChange={setCategoryFilter}
              />
            </div>
          </div>
          {content}
          <div className="mt-8 flex justify-center">
            <Button href="/pages/support" variant="ghost" className="rounded-full px-4">
              Δημιούργησε νέο αίτημα
            </Button>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
