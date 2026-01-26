'use client';

import { Edit, ShieldCheck, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/app/components/ui/Button';
import type { User } from '@/types/user';

type ProfileHeaderProps = {
  user: User;
};

export function ProfileHeader({ user }: Readonly<ProfileHeaderProps>) {
  const router = useRouter();
  const avatarUrl = (user.avatar_url || '').trim();
  const displayName = user.display_name || user.username;
  const isAdmin = user.role === 'admin';
  const isAuthor = user.role === 'author';

  return (
    <section className="relative px-4 pb-12 pt-8 md:px-6 md:pb-16 md:pt-12">
      <div className="mx-auto max-w-4xl">
        {/* Eyebrow */}
        <p className="mb-6 text-center text-xs uppercase tracking-[0.3em] text-[var(--hb-primary-strong)]">
          Χομπίστας • Προφίλ
        </p>

        {/* Avatar + Name Group */}
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          {avatarUrl ? (
            <div className="relative mb-5 h-28 w-28 overflow-hidden rounded-full border-2 border-[var(--hb-border)] shadow-[0_12px_40px_rgba(3,7,18,0.6)] md:h-32 md:w-32">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt={`${displayName} avatar`}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-full border-2 border-[var(--hb-border)] bg-[var(--hb-card)] text-4xl font-bold text-[var(--hb-headline)] shadow-[0_12px_40px_rgba(3,7,18,0.6)] md:h-32 md:w-32">
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          {/* Name with gradient */}
          <h1 className="mb-2 text-3xl font-extrabold leading-tight md:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-[var(--hb-headline)] via-[var(--hb-text)] to-[var(--hb-muted)] bg-clip-text text-transparent">
              {displayName}
            </span>
          </h1>

          {/* Username */}
          <p className="mb-4 text-base text-[var(--hb-muted)]">@{user.username}</p>

          {/* Badges */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            {/* Role badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--hb-headline)]">
              {(isAdmin || isAuthor) && <ShieldCheck className="h-3.5 w-3.5 text-[var(--hb-primary-strong)]" />}
              {user.role}
            </span>

            {/* Verified badge */}
            {user.email_verified && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <CheckCircle className="h-3.5 w-3.5" />
                Επιβεβαιωμένο
              </span>
            )}
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-[var(--hb-muted)]">
              {user.bio}
            </p>
          )}

          {/* Edit button */}
          <Button
            onClick={() => router.push('/pages/profile/edit')}
            variant="primary"
            icon={<Edit className="h-4 w-4" />}
          >
            Επεξεργασία Προφίλ
          </Button>
        </div>
      </div>
    </section>
  );
}
