'use client';

import { Edit, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/user';
import { hasAnyRole } from '@/lib/roles';

type ProfileHeaderProps = {
  user: User;
};

export function ProfileHeader({ user }: Readonly<ProfileHeaderProps>) {
  const router = useRouter();
  const avatarUrl = (user.avatar_url || '').trim();
  const displayName = user.display_name || user.username;
  const showShield = hasAnyRole(user, ['admin', 'owner', 'moderator', 'author', 'reviewer']);

  return (
    <section className="relative px-4 pb-10 pt-8 md:px-6 md:pb-16 md:pt-12">
      <div className="mx-auto max-w-4xl">
        {/* Eyebrow */}
        <p className="mb-6 text-center text-xs uppercase tracking-[0.3em] text-[var(--hb-primary-strong)]">
          Hobbistas • Προφίλ
        </p>

        {/* Avatar + Name Group */}
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          {avatarUrl ? (
            <div className="relative mb-5 h-28 w-28 overflow-hidden rounded-full border-2 border-[var(--hb-border)] shadow-[var(--hb-shadow-md)] md:h-32 md:w-32">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt={`${displayName} avatar`}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-full border-2 border-[var(--hb-border)] bg-[var(--hb-card)] text-4xl font-bold text-[var(--hb-headline)] shadow-[var(--hb-shadow-md)] md:h-32 md:w-32">
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          {/* Name with gradient */}
          <h1 className="mb-2 w-full text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
            <span className="inline-block break-words bg-gradient-to-r from-[var(--hb-headline)] via-[var(--hb-text)] to-[var(--hb-muted)] bg-clip-text text-transparent">
              {displayName}
            </span>
          </h1>

          {/* Username */}
          <p className="mb-4 break-all text-base text-[var(--hb-muted)]">@{user.username}</p>

          {/* Badges */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            {/* Role badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--hb-headline)]">
              {showShield && (
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--hb-primary-strong)]" />
              )}
              {user.role}
            </span>

            {/* Verified badge */}
            {user.email_verified && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                Επιβεβαιωμένο
              </span>
            )}
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="mx-auto mb-8 max-w-xl break-words text-base leading-relaxed text-[var(--hb-muted)]">
              {user.bio}
            </p>
          )}

          {/* Edit button */}
          <Button
            onClick={() => router.push('/pages/profile/edit')}
            variant="primary"
            icon={<Edit className="h-4 w-4" />}
            className="w-full sm:w-auto"
          >
            Επεξεργασία Προφίλ
          </Button>
        </div>
      </div>
    </section>
  );
}
