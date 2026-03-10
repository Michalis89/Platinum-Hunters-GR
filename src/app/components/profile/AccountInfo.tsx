import { Calendar, Clock3, Shield } from 'lucide-react';
import type { User } from '@/types/user';
import { FormattedDate } from '@/utils/components/FormattedDate';
import type { ResolvedProfileIdentity } from './profileData';

type AccountInfoProps = {
  user: User;
  identity: ResolvedProfileIdentity | null;
};

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

export function AccountInfo({ user, identity }: Readonly<AccountInfoProps>) {
  const primaryRole = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : 'user';

  return (
    <section
      aria-labelledby="account-info-heading"
      className="rounded-3xl border border-border/60 bg-card/50 p-5 sm:p-6"
    >
      <header className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Metadata</p>
        <h2 id="account-info-heading" className="mt-1 text-xl font-semibold tracking-tight text-foreground">
          Account Info
        </h2>
      </header>

      <dl className="space-y-3">
        <div className="rounded-xl border border-border/50 bg-card/65 p-3 transition-colors hover:border-primary/30">
          <dt className="mb-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Member Since
          </dt>
          <dd className="text-sm font-medium text-foreground">
            <FormattedDate
              date={identity?.memberSince ?? user.created_at}
              options={DATE_OPTIONS}
              fallback="Unknown"
            />
          </dd>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/65 p-3 transition-colors hover:border-primary/30">
          <dt className="mb-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            Last Login
          </dt>
          <dd className="text-sm font-medium text-foreground">
            <FormattedDate date={identity?.lastLogin ?? user.last_login} options={DATE_OPTIONS} fallback="Unknown" />
          </dd>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/65 p-3 transition-colors hover:border-primary/30">
          <dt className="mb-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            Status
          </dt>
          <dd className="text-sm font-medium capitalize text-foreground">{user.account_status || 'active'}</dd>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/65 p-3 transition-colors hover:border-primary/30">
          <dt className="mb-1 text-xs text-muted-foreground">Role</dt>
          <dd className="text-sm capitalize text-foreground">{primaryRole}</dd>
        </div>
      </dl>
    </section>
  );
}
