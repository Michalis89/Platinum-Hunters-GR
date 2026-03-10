import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import type { User } from '@/types/user';
import { FormattedDate } from '@/utils/components/FormattedDate';

const LONG_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

type ProfileAccountInfoProps = {
  user: User;
};

export function ProfileAccountInfo({ user }: Readonly<ProfileAccountInfoProps>) {
  return (
    <section className="px-4 py-12 md:px-6 md:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 text-center md:mb-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Account
          </p>
          <h2 className="text-2xl font-semibold md:text-3xl">Account Information</h2>
        </div>

        <div className="rounded-2xl border border-border/50 bg-muted/20 p-5 sm:p-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-card/70">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm font-medium text-foreground">
                  <FormattedDate
                    date={user.created_at}
                    options={LONG_DATE_OPTIONS}
                    fallback="Not available"
                  />
                </p>
              </div>
            </div>

            {user.last_login && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-card/70">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Login</p>
                  <p className="text-sm font-medium text-foreground">
                    <FormattedDate
                      date={user.last_login}
                      options={LONG_DATE_OPTIONS}
                      fallback="Not available"
                    />
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
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
