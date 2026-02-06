'use client';

import { useTickets } from '@/lib/hooks/useTickets';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { Search, ShieldCheck } from 'lucide-react';
import { PageContainer } from '@/app/components/layout/PageContainer';
import PageHero from '@/app/components/shared/PageHero';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import EmptyState from '@/app/components/ui/EmptyState';
import ErrorState from '@/app/components/ui/ErrorState';
import Button from '@/app/components/ui/Button';
import Feedback from '@/app/components/ui/Feedback';
import { selectIsAdminOrModerator } from '@/store/slices/authSlice';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import SupportTicketCard from '@/app/components/support/SupportTicketCard.client';
import {
  SUPPORT_STATUS_OPTIONS as STATUS_OPTIONS,
  SUPPORT_CATEGORY_OPTIONS as CATEGORY_OPTIONS,
  SUPPORT_SEVERITY_OPTIONS as SEVERITY_OPTIONS,
  SUPPORT_STATUS_LABELS as statusLabels,
  SUPPORT_STATUS_COLORS as statusColors,
  SUPPORT_CATEGORY_LABELS as categoryLabels,
  SUPPORT_SEVERITY_LABELS as severityLabels,
} from '@/lib/constants/support';
import { UI_CLASSNAMES } from '@/lib/constants/ui';

type AdminTicket = {
  id: string;
  category: string;
  subject: string;
  status: string;
  severity: string | null;
  created_at: string;
  updated_at: string;
  email: string | null;
  name: string | null;
  users?: {
    id: string;
    username: string;
    display_name: string | null;
    email: string | null;
  } | null;
};

export default function AdminSupportInbox() {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const isAdmin = useSelector(selectIsAdminOrModerator);

  const {
    tickets,
    setTickets,
    loading,
    error,
    filters,
    setFilters,
    meta,
    actionLoading,
    setActionLoading,
    alert,
    setAlert,
  } = useTickets<
    AdminTicket,
    {
      status: string;
      category: string;
      severity: string;
      q: string;
    }
  >({
    endpoint: '/api/admin/support/tickets',
    enabled: isAuthenticated && isAdmin,
    initialFilters: {
      status: '',
      category: '',
      severity: '',
      q: '',
    },
    errorMessage: 'Αποτυχία φόρτωσης',
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--hb-bg)]">
        <LoadingSpinner size="lg" label="Φόρτωση..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isAdmin) {
    return (
      <PageContainer size="md" className="py-20">
        <ErrorState error="Δεν έχεις πρόσβαση σε αυτή τη σελίδα." />
      </PageContainer>
    );
  }

  return (
    <div className={UI_CLASSNAMES.pageShell}>
      <div className={UI_CLASSNAMES.pageBackdrop}>
        <div className={UI_CLASSNAMES.pageGradient} />
      </div>
      <div className="relative mt-10">
        <PageHero
          eyebrow="Διαχείριση"
          title={
            <span className="text-3xl text-[var(--hb-headline)] md:text-5xl">
              Εισερχόμενα Υποστήριξης
            </span>
          }
          subtitle="Διαχειρίσου όλα τα εισερχόμενα αιτήματα υποστήριξης."
          badges={
            <span className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1">
              <ShieldCheck className="mr-2 inline h-4 w-4" />
              Μόνο για διαχειριστές
            </span>
          }
        />

        <PageContainer size="lg" className="mt-10 pb-20">
          {alert && (
            <div className="mb-4">
              <Feedback
                variant={alert.type}
                tone="solid"
                description={alert.message}
                actionLabel={alert.onConfirm ? 'Διαγραφή' : undefined}
                onAction={alert.onConfirm}
                secondaryActionLabel={alert.onCancel ? 'Άκυρο' : undefined}
                onSecondaryAction={() => {
                  alert.onCancel?.();
                  setAlert(null);
                }}
                onDismiss={() => setAlert(null)}
              />
            </div>
          )}
          <Card className={UI_CLASSNAMES.panelCard}>
            <CardHeader className="border-[var(--hb-border)]">
              <CardTitle className="text-[var(--hb-headline)]">Φίλτρα</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <Select
                label="Κατάσταση"
                value={filters.status}
                onChange={value => setFilters(prev => ({ ...prev, status: value }))}
                options={STATUS_OPTIONS}
                optionLabels={statusLabels}
                placeholder="Όλα"
                labelClassName="text-[var(--hb-headline)]"
                className="border-[var(--hb-border)] bg-[var(--hb-panel)] text-[var(--hb-text)]"
              />
              <Select
                label="Κατηγορία"
                value={filters.category}
                onChange={value => setFilters(prev => ({ ...prev, category: value }))}
                options={CATEGORY_OPTIONS}
                optionLabels={categoryLabels}
                placeholder="Όλες"
                labelClassName="text-[var(--hb-headline)]"
                className="border-[var(--hb-border)] bg-[var(--hb-panel)] text-[var(--hb-text)]"
              />
              <Select
                label="Σοβαρότητα"
                value={filters.severity}
                onChange={value => setFilters(prev => ({ ...prev, severity: value }))}
                options={SEVERITY_OPTIONS}
                optionLabels={severityLabels}
                placeholder="Όλες"
                labelClassName="text-[var(--hb-headline)]"
                className="border-[var(--hb-border)] bg-[var(--hb-panel)] text-[var(--hb-text)]"
              />
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--hb-headline)]">Αναζήτηση</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={filters.q}
                    onChange={event => setFilters(prev => ({ ...prev, q: event.target.value }))}
                    placeholder="Θέμα ή περιγραφή"
                    className="border-[var(--hb-border)] bg-[var(--hb-card)]"
                  />
                  <Button variant="secondary" className="px-3">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            {loading ? (
              <div className="py-16">
                <LoadingSpinner label="Φορτώνουμε το inbox..." />
              </div>
            ) : error ? (
              <ErrorState error={error} />
            ) : tickets.length === 0 ? (
              <EmptyState
                title="Δεν υπάρχουν tickets"
                description="Δεν βρέθηκαν αιτήματα με τα συγκεκριμένα φίλτρα."
              />
            ) : (
              <div className="space-y-4">
                {meta ? (
                  <div className="text-xs text-[var(--hb-muted)]">
                    Σύνολο αποτελεσμάτων: {meta.total}
                  </div>
                ) : null}
                {tickets.map(ticket => (
                  <SupportTicketCard
                    key={ticket.id}
                    subject={ticket.subject}
                    statusText={statusLabels[ticket.status] || ticket.status}
                    statusColor={statusColors[ticket.status] || 'gray'}
                    categoryText={categoryLabels[ticket.category] || ticket.category}
                    severityText={
                      ticket.severity
                        ? `Σοβαρότητα: ${severityLabels[ticket.severity] || ticket.severity}`
                        : null
                    }
                    updatedAt={ticket.updated_at}
                    meta={
                      <div className="text-xs text-[var(--hb-muted)]">
                        Από:{' '}
                        {ticket.name || ticket.users?.display_name || ticket.users?.username || '—'}
                        {' • '}
                        {ticket.email || ticket.users?.email || '—'}
                      </div>
                    }
                    actions={
                      <>
                        <Button href={`/admin/support/${ticket.id}`} variant="secondary">
                          Άνοιγμα ticket
                        </Button>
                        <Button
                          variant="danger"
                          disabled={actionLoading === ticket.id}
                          onClick={() => {
                            setAlert({
                              type: 'warning',
                              message: 'Οριστική διαγραφή ticket; Η ενέργεια δεν αναιρείται.',
                              onConfirm: async () => {
                                setAlert(null);
                                setActionLoading(ticket.id);
                                try {
                                  const res = await fetch(
                                    `/api/admin/support/tickets/${ticket.id}`,
                                    {
                                      method: 'DELETE',
                                    },
                                  );
                                  const payload = await res.json().catch(() => null);
                                  if (!res.ok) {
                                    throw new Error(payload?.error || 'Αποτυχία διαγραφής');
                                  }
                                  setTickets(prev => prev.filter(t => t.id !== ticket.id));
                                  setAlert(null);
                                  setTimeout(
                                    () =>
                                      setAlert({
                                        type: 'success',
                                        message: 'Το ticket διαγράφηκε.',
                                      }),
                                    80,
                                  );
                                } catch (err) {
                                  setAlert({
                                    type: 'error',
                                    message:
                                      err instanceof Error ? err.message : 'Σφάλμα διαγραφής',
                                  });
                                } finally {
                                  setActionLoading(null);
                                }
                              },
                              onCancel: () => setAlert(null),
                            });
                          }}
                        >
                          Διαγραφή
                        </Button>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-10 text-center text-xs text-[var(--hb-muted)]">
            <Link href="/" className="hover:text-[var(--hb-primary)]">
              Επιστροφή στην αρχική
            </Link>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
