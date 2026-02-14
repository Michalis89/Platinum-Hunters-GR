'use client';

import { useTickets } from '@/lib/hooks/useTickets';
import Link from 'next/link';
import { Search, ShieldCheck, X } from 'lucide-react';
import { PageContainer } from '@/app/components/layout/PageContainer';
import PageHero from '@/app/components/shared/PageHero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SelectField as Select } from '@/components/ui/select-field';
import { Spinner } from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty';
import { Alert, AlertDescription, ErrorAlert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import type { TicketsAlert } from '@/lib/hooks/useTickets';

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

const mapAlertVariant = (type: TicketsAlert['type']) => (type === 'error' ? 'destructive' : type);

export default function AdminSupportTicketsPane() {
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
    initialFilters: {
      status: '',
      category: '',
      severity: '',
      q: '',
    },
    errorMessage: 'Αποτυχία φόρτωσης',
  });

  return (
    <div className={UI_CLASSNAMES.pageShell}>
      <div className={UI_CLASSNAMES.pageBackdrop}>
        <div className={UI_CLASSNAMES.pageGradient} />
      </div>
      <div className="relative mt-10">
        <PageHero
          eyebrow="Διαχείριση"
          title={
            <span className="text-3xl text-foreground md:text-5xl">Εισερχόμενα Υποστήριξης</span>
          }
          subtitle="Διαχειρίσου όλα τα εισερχόμενα αιτήματα υποστήριξης."
          badges={
            <span className="rounded-full border border-border bg-card px-3 py-1">
              <ShieldCheck className="mr-2 inline h-4 w-4" />
              Μόνο για διαχειριστές
            </span>
          }
        />

        <PageContainer size="lg" className="mt-10 max-w-none pb-20">
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
                          className="font-medium"
                          onClick={alert.onConfirm}
                        >
                          Διαγραφή
                        </Button>
                      )}
                      {alert.onCancel && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="font-medium"
                          onClick={() => {
                            alert.onCancel?.();
                            setAlert(null);
                          }}
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
          <Card className={UI_CLASSNAMES.panelCard}>
            <CardHeader className="border-border">
              <CardTitle className="text-foreground">Φίλτρα</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <Select
                label="Κατάσταση"
                value={filters.status}
                onChange={value => setFilters(prev => ({ ...prev, status: value }))}
                options={STATUS_OPTIONS}
                optionLabels={statusLabels}
                placeholder="Όλα"
                labelClassName="text-foreground"
                className="border-border bg-card text-foreground"
              />
              <Select
                label="Κατηγορία"
                value={filters.category}
                onChange={value => setFilters(prev => ({ ...prev, category: value }))}
                options={CATEGORY_OPTIONS}
                optionLabels={categoryLabels}
                placeholder="Όλες"
                labelClassName="text-foreground"
                className="border-border bg-card text-foreground"
              />
              <Select
                label="Σοβαρότητα"
                value={filters.severity}
                onChange={value => setFilters(prev => ({ ...prev, severity: value }))}
                options={SEVERITY_OPTIONS}
                optionLabels={severityLabels}
                placeholder="Όλες"
                labelClassName="text-foreground"
                className="border-border bg-card text-foreground"
              />
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Αναζήτηση</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={filters.q}
                    onChange={event => setFilters(prev => ({ ...prev, q: event.target.value }))}
                    placeholder="Θέμα ή περιγραφή"
                    className="border-border bg-card"
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
                <div className="flex flex-col items-center justify-center gap-3">
                  <Spinner />
                  <span className="text-sm text-muted-foreground">Φορτώνουμε το inbox...</span>
                </div>
              </div>
            ) : error ? (
              <ErrorAlert message={error} />
            ) : tickets.length === 0 ? (
              <EmptyState
                title="Δεν υπάρχουν tickets"
                description="Δεν βρέθηκαν αιτήματα με τα συγκεκριμένα φίλτρα."
              />
            ) : (
              <div className="space-y-4">
                {meta ? (
                  <div className="text-xs text-muted-foreground">
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
                      <div className="text-xs text-muted-foreground">
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
                          variant="destructive"
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

          <div className="mt-10 text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:text-primary">
              Επιστροφή στην αρχική
            </Link>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
