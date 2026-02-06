'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Inbox, Ticket } from 'lucide-react';
import { PageContainer } from '@/app/components/layout/PageContainer';
import PageHero from '@/app/components/shared/PageHero';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import EmptyState from '@/app/components/ui/EmptyState';
import ErrorState from '@/app/components/ui/ErrorState';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/app/components/ui/SegmentedControl';
import { Select } from '@/app/components/ui/Select';
import Feedback from '@/app/components/ui/Feedback';
import SupportTicketCard from '@/app/components/support/SupportTicketCard.client';
import { selectIsAuthenticated, selectIsLoading } from '@/store/slices/authSlice';
import { useTickets } from '@/lib/hooks/useTickets';
import {
  SUPPORT_STATUS_LABELS,
  SUPPORT_STATUS_COLORS,
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_SEVERITY_LABELS,
} from '@/lib/constants/support';
import { UI_CLASSNAMES } from '@/lib/constants/ui';

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

export default function SupportTicketsList() {
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authLoading = useSelector(selectIsLoading);

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
    enabled: isAuthenticated,
  });
  const [view, setView] = useState<'active' | 'all' | 'archive'>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/pages/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

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
          <LoadingSpinner label="Φορτώνουμε τα tickets..." />
        </div>
      );
    }

    if (error) {
      return <ErrorState error={error} onRetry={reload} />;
    }

    if (filteredTickets.length === 0) {
      return (
        <EmptyState
          icon={<Inbox className="h-10 w-10 text-[var(--hb-primary)]" />}
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
            titleIcon={<Ticket className="h-5 w-5 text-[var(--hb-primary)]" />}
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
                    className="text-[var(--hb-headline)]"
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

  return (
    <div className={UI_CLASSNAMES.pageShell}>
      <div className={UI_CLASSNAMES.pageBackdrop}>
        <div className={UI_CLASSNAMES.pageGradient} />
      </div>
      <div className="relative">
        <PageHero
          eyebrow="Υποστήριξη"
          title={
            <span className="text-3xl text-[var(--hb-headline)] md:text-5xl">Τα tickets μου</span>
          }
          subtitle="Δες όλα τα αιτήματα υποστήριξης και την εξέλιξή τους."
        />
        <PageContainer size="md" className="pb-20">
          {alert && (
            <div className="mb-4">
              <Feedback
                variant={alert.type}
                tone="solid"
                layout="inline"
                description={alert.message}
                actionLabel={alert.onConfirm ? 'Διαγραφή' : undefined}
                onAction={alert.onConfirm}
                secondaryActionLabel={alert.onCancel ? 'Άκυρο' : undefined}
              onSecondaryAction={() => {
                alert.onCancel?.();
                setAlert(null);
              }}
              onDismiss={() => {
                setAlert(null);
              }}
            />
          </div>
        )}
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <SegmentedControl
              options={[
                { id: 'active', label: 'Ενεργά' },
                { id: 'all', label: 'Όλα' },
                { id: 'archive', label: 'Αρχείο' },
              ]}
              value={view}
              onChange={value => setView(value as typeof view)}
            />
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
            <Link
              href="/pages/support"
              className="text-sm font-semibold text-[var(--hb-primary)] hover:text-[var(--hb-accent)]"
            >
              Δημιούργησε νέο αίτημα
            </Link>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
