'use client';

import { useEffect, useState } from 'react';
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
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import Feedback from '@/app/components/ui/Feedback';
import { selectUser } from '@/store/slices/authSlice';
import { hasAnyRole } from '@/lib/roles';

const STATUS_OPTIONS = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed'];
const CATEGORY_OPTIONS = ['bug', 'feature', 'author_rights', 'general'];
const SEVERITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

const statusLabels: Record<string, string> = {
  open: 'Ανοικτό',
  in_progress: 'Σε εξέλιξη',
  waiting_user: 'Απάντηση από χρήστη',
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
  const user = useSelector(selectUser);
  const isAdmin = hasAnyRole(user, ['admin', 'owner', 'moderator']);

  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    severity: '',
    q: '',
  });
  const [meta, setMeta] = useState<{ total: number; limit: number; offset: number } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  } | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    let ignore = false;

    const loadTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.category) params.set('category', filters.category);
        if (filters.severity) params.set('severity', filters.severity);
        if (filters.q) params.set('q', filters.q);

        const response = await fetch(`/api/admin/support/tickets?${params.toString()}`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Αποτυχία φόρτωσης');
        }
        if (!ignore) {
          setTickets(payload.data ?? []);
          setMeta(payload.meta ?? null);
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
  }, [filters, isAdmin]);

  if (!isAdmin) {
    return (
      <PageContainer size="md" className="py-20">
        <ErrorState error="Δεν έχεις πρόσβαση σε αυτή τη σελίδα." />
      </PageContainer>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--hb-bg)] text-[var(--hb-text)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
        <div className="absolute inset-0 bg-[var(--hb-gradient)] blur-[100px]" />
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
          <Card className="border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[var(--hb-shadow-md)]">
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
                  <Card
                    key={ticket.id}
                    className="border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[var(--hb-shadow-md)]"
                  >
                    <CardHeader className="border-[var(--hb-border)]">
                      <CardTitle className="flex flex-col gap-2 text-[var(--hb-headline)] md:flex-row md:items-center md:justify-between">
                        <span>{ticket.subject}</span>
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
                        <span>{new Date(ticket.updated_at).toLocaleString('el-GR')}</span>
                      </div>
                      <div className="text-xs text-[var(--hb-muted)]">
                        Από:{' '}
                        {ticket.name || ticket.users?.display_name || ticket.users?.username || '—'}
                        {' • '}
                        {ticket.email || ticket.users?.email || '—'}
                      </div>
                     <div className="pt-2">
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
                                  const res = await fetch(`/api/admin/support/tickets/${ticket.id}`, {
                                    method: 'DELETE',
                                  });
                                  const payload = await res.json().catch(() => null);
                                  if (!res.ok) {
                                    throw new Error(payload?.error || 'Αποτυχία διαγραφής');
                                  }
                          setTickets(prev => prev.filter(t => t.id !== ticket.id));
                          setAlert(null);
                          setTimeout(
                            () => setAlert({ type: 'success', message: 'Το ticket διαγράφηκε.' }),
                            80,
                          );
                                } catch (err) {
                                  setAlert({
                                    type: 'error',
                                    message: err instanceof Error ? err.message : 'Σφάλμα διαγραφής',
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
                     </div>
                    </CardContent>
                  </Card>
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
