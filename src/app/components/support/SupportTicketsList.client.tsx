'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Inbox, Ticket } from 'lucide-react';
import { PageContainer } from '@/app/components/layout/PageContainer';
import PageHero from '@/app/components/shared/PageHero';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import EmptyState from '@/app/components/ui/EmptyState';
import ErrorState from '@/app/components/ui/ErrorState';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import { SegmentedControl } from '@/app/components/ui/SegmentedControl';
import { Select } from '@/app/components/ui/Select';
import Feedback from '@/app/components/ui/Feedback';
import { selectIsAuthenticated, selectIsLoading } from '@/store/slices/authSlice';

const statusLabels: Record<string, string> = {
  open: 'Ανοικτό',
  in_progress: 'Σε εξέλιξη',
  waiting_user: 'Απάντηση από εσένα',
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

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'active' | 'all' | 'archive'>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/pages/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let ignore = false;

    const loadTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/support/tickets');
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Αποτυχία φόρτωσης tickets');
        }
        if (!ignore) {
          setTickets(payload.data ?? []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Κάτι πήγε στραβά');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadTickets();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

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
      return <ErrorState error={error} onRetry={() => window.location.reload()} />;
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
          <Card
            key={ticket.id}
            className="border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[var(--hb-shadow-md)]"
          >
            <CardHeader className="border-[var(--hb-border)]">
              <CardTitle className="flex flex-col gap-2 text-[var(--hb-headline)] md:flex-row md:items-center md:justify-between">
                <span className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-[var(--hb-primary)]" />
                  {ticket.subject}
                </span>
                <Badge
                  text={statusLabels[ticket.status] || ticket.status}
                  color={statusColors[ticket.status] || 'gray'}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[var(--hb-muted)]">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-1 text-xs text-[var(--hb-text)]">
                  {categoryLabels[ticket.category] || ticket.category}
                </span>
                {ticket.severity ? (
                  <span className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-1 text-xs text-[var(--hb-text)]">
                    Σοβαρότητα: {severityLabels[ticket.severity] || ticket.severity}
                  </span>
                ) : null}
                <span>
                  Τελευταία ενημέρωση: {new Date(ticket.updated_at).toLocaleString('el-GR')}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button href={`/pages/support/tickets/${ticket.id}`} variant="secondary">
                  Δες λεπτομέρειες
                </Button>
                {view === 'archive' ? (
                  <Button
                    variant="ghost"
                    onClick={() => handleArchiveToggle(ticket.id, false)}
                    className="text-[var(--hb-muted)] hover:text-[var(--hb-headline)]"
                    disabled={actionLoading === ticket.id}
                  >
                    Επαναφορά από αρχείο
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => handleArchiveToggle(ticket.id, true)}
                    className="text-[var(--hb-muted)] hover:text-[var(--hb-headline)]"
                    disabled={actionLoading === ticket.id}
                  >
                    Μεταφορά στο αρχείο
                  </Button>
                )}
                {view === 'archive' && (
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(ticket.id)}
                    className="text-[var(--hb-headline)]"
                    disabled={actionLoading === ticket.id}
                  >
                    Διαγραφή
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
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
    <div className="relative min-h-screen bg-[var(--hb-bg)] text-[var(--hb-text)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
        <div className="absolute inset-0 bg-[var(--hb-gradient)] blur-[100px]" />
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
