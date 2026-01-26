'use client';

import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import type { User } from '@/types/user';

type ProfileAccountInfoProps = {
  user: User;
};

function formatDate(dateString: string | null) {
  if (!dateString) return 'Μη καθορισμένο';
  return new Date(dateString).toLocaleDateString('el-GR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ProfileAccountInfo({ user }: Readonly<ProfileAccountInfoProps>) {
  return (
    <section className="px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
            Λογαριασμός
          </p>
          <h2 className="text-2xl font-bold text-[var(--hb-headline)] md:text-3xl">
            Πληροφορίες Λογαριασμού
          </h2>
        </div>

        <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-[0_12px_30px_rgba(3,7,18,0.35)]">
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Member since */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--hb-primary-strong)]/10">
                <Calendar className="h-5 w-5 text-[var(--hb-primary-strong)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--hb-muted)]">Μέλος από</p>
                <p className="text-sm font-medium text-[var(--hb-headline)]">
                  {formatDate(user.created_at)}
                </p>
              </div>
            </div>

            {/* Last login */}
            {user.last_login && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--hb-primary-strong)]/10">
                  <Clock className="h-5 w-5 text-[var(--hb-primary-strong)]" />
                </div>
                <div>
                  <p className="text-xs text-[var(--hb-muted)]">Τελευταία σύνδεση</p>
                  <p className="text-sm font-medium text-[var(--hb-headline)]">
                    {formatDate(user.last_login)}
                  </p>
                </div>
              </div>
            )}

            {/* Account status */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-[var(--hb-muted)]">Κατάσταση</p>
                <p className="text-sm font-medium capitalize text-emerald-400">
                  {user.account_status || 'active'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
