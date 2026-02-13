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
    <section className="relative px-4 pb-10 pt-8 md:px-6 md:pb-14 md:pt-10">
      <div className="mx-auto max-w-4xl">
        {/* Eyebrow */}
        <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.24em]">
          Hobbistas • Προφίλ
        </p>

        {/* Avatar + Name Group */}
        <div className="flex flex-col items-center p-6 text-center sm:p-8">
          {/* Avatar */}
          {avatarUrl ? (
            <div className="relative mb-5 h-28 w-28 rounded-full border md:h-32 md:w-32">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt={`${displayName} avatar`}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-full border bg-card text-4xl font-semibold text-foreground md:h-32 md:w-32">
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          {/* Name */}
          <h1 className="mb-1 w-full text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
            <span className="inline-block break-words">{displayName}</span>
          </h1>

          {/* Username */}
          <p className="mb-4 break-all text-base">@{user.username}</p>

          {/* Badges */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            {/* Role badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-foreground">
              {showShield && <ShieldCheck className="text-info h-3.5 w-3.5" />}
              {user.role}
            </span>

            {/* Verified badge */}
            {user.email_verified && (
              <span className="bg-emerald-500/12 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                Επιβεβαιωμένο
              </span>
            )}
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="mx-auto mb-8 max-w-xl break-words text-base leading-relaxed">
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
