'use client';

import { useRouter } from 'next/navigation';
import { BadgeCheck, CalendarDays, Edit, MapPin, ShieldCheck } from 'lucide-react';
import { AvatarImage } from '@/components/ui/avatar-image';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/user';
import { FormattedDate } from '@/utils/components/FormattedDate';
import type { ResolvedProfileIdentity } from './profileData';
import { calculateAge, getLocationLabel, getPrivacyValue } from './profileData';

type ProfileStats = {
  articles: number | null;
  reviews: number | null;
  entries: number | null;
};

type ProfileHeroProps = {
  user: User;
  identity: ResolvedProfileIdentity | null;
  stats: ProfileStats;
  loadingStats?: boolean;
};

const MEMBER_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

export function ProfileHero({
  user,
  identity,
  stats,
  loadingStats = false,
}: Readonly<ProfileHeroProps>) {
  const router = useRouter();
  const displayName = identity?.displayName || user.display_name || user.username || 'User';
  const username = identity?.username || user.username || 'user';
  const avatarUrl = (user.avatar_url || '').trim();
  const showAge = getPrivacyValue(user, 'show_age', false);
  const showLocation = getPrivacyValue(user, 'show_location', true);
  const showStats = getPrivacyValue(user, 'show_stats', true);
  const age = calculateAge(user.date_of_birth);
  const location = getLocationLabel(user);
  const hasOwnerRole = Array.isArray(user.roles) && user.roles.includes('owner');

  const statsItems: Array<{ label: string; value: number | null }> = [
    { label: 'Entries', value: stats.entries },
    { label: 'Articles', value: stats.articles },
    { label: 'Reviews', value: stats.reviews },
  ];

  return (
    <section
      aria-label="Profile hero"
      className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28" />
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4 sm:gap-5">
          <div className="relative">
            {avatarUrl ? (
              <div className="h-24 w-24 overflow-hidden rounded-[26px] border border-primary/25 bg-card shadow-[0_0_0_1px_rgba(139,92,246,0.18)] sm:h-28 sm:w-28">
                <AvatarImage
                  src={avatarUrl}
                  alt={`${displayName} avatar`}
                  size={112}
                  className="h-full w-full rounded-[26px]"
                />
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-[26px] border border-primary/25 bg-card text-3xl font-semibold text-foreground shadow-[0_0_0_1px_rgba(139,92,246,0.18)] transition-all duration-300 group-hover:border-primary/45 group-hover:shadow-[0_0_34px_rgba(139,92,246,0.5)] sm:h-28 sm:w-28">
                {username.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
                {displayName}
              </h1>
              {hasOwnerRole && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/35 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <ShieldCheck className="h-3 w-3" />
                  Owner
                </span>
              )}
            </div>
            <p className="mt-1 break-all text-sm text-muted-foreground sm:text-base">@{username}</p>

            {user.bio && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                {user.bio}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm">
              {identity?.emailVerified && (
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Email verified
                </span>
              )}
              {showLocation && location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {location}
                </span>
              )}
              {showAge && age !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {age} years old
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Joined{' '}
                <FormattedDate
                  date={identity?.memberSince ?? user.created_at}
                  options={MEMBER_DATE_OPTIONS}
                  fallback="Unknown"
                />
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={() => router.push('/profile/edit')}
          variant="outline"
          size="sm"
          icon={<Edit className="h-3.5 w-3.5" />}
          className="md:shrink-0"
          aria-label="Edit profile"
        >
          Edit Profile
        </Button>
      </div>

      {showStats && (
        <div className="relative mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {statsItems.map(item => (
            <div
              key={item.label}
              className="rounded-xl border border-border/60 bg-card/70 px-3 py-3 transition-all duration-200 hover:border-primary/35"
            >
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 text-xl font-semibold text-foreground" aria-live="polite">
                {loadingStats ? '...' : (item.value ?? '-')}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
