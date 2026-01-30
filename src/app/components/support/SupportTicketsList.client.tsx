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
};

export default function SupportTicketsList() {
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authLoading = useSelector(selectIsLoading);

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    if (tickets.length === 0) {
      return (
        <EmptyState
          icon={<Inbox className="h-10 w-10 text-[var(--hb-primary)]" />}
          title="Δεν υπάρχουν tickets ακόμα"
          description="Ξεκίνα με το πρώτο σου αίτημα υποστήριξης."
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
        {tickets.map(ticket => (
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
                <Badge text={statusLabels[ticket.status] || ticket.status} color={statusColors[ticket.status] || 'gray'} />
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
              <div className="pt-2">
                <Button href={`/pages/support/tickets/${ticket.id}`} variant="secondary">
                  Δες λεπτομέρειες
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }, [tickets, loading, error]);

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
          title={<span className="text-3xl text-[var(--hb-headline)] md:text-5xl">Τα tickets μου</span>}
          subtitle="Δες όλα τα αιτήματα υποστήριξης και την εξέλιξή τους."
        />
        <PageContainer size="md" className="pb-20">
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
