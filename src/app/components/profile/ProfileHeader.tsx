'use client';

import { useState } from 'react';
import { Edit, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AvatarImage } from '@/components/ui/avatar-image';
import type { User } from '@/types/user';
import { cn } from '@/lib/utils';

type ProfileHeaderProps = {
  user: User;
};

export function ProfileHeader({ user }: Readonly<ProfileHeaderProps>) {
  const router = useRouter();
  const [bioExpanded, setBioExpanded] = useState(false);

  const avatarUrl = (user.avatar_url || '').trim();
  const displayName = user.display_name || user.username;
  const bio = (user.bio || '').trim();
  const canExpandBio = bio.length > 160;
  const showOwnerBadge = user.role?.toLowerCase() === 'owner';

  return (
    <section className="relative px-4 pb-10 pt-8 md:px-6 md:pb-12 md:pt-10">
      <div className="mx-auto max-w-4xl rounded-3xl border border-border/60 bg-card/40 p-5 sm:p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-4 sm:gap-5">
            {avatarUrl ? (
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border border-border/60 sm:h-24 sm:w-24">
                <AvatarImage
                  src={avatarUrl}
                  alt={`${displayName} avatar`}
                  size={96}
                  className="h-full w-full rounded-full"
                />
              </div>
            ) : (
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border border-border/60 bg-card text-3xl font-semibold text-foreground sm:h-24 sm:w-24">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="break-words text-3xl font-semibold leading-tight text-foreground md:text-4xl">
                {displayName}
              </h1>
              <p className="mt-1 break-all text-sm text-muted-foreground sm:text-base">@{user.username}</p>

              {showOwnerBadge && (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <ShieldCheck className="h-3 w-3" />
                  OWNER
                </span>
              )}
            </div>
          </div>

          <Button
            onClick={() => router.push('/profile/edit')}
            variant="outline"
            size="sm"
            icon={<Edit className="h-3.5 w-3.5" />}
            className="hidden md:inline-flex"
          >
            Edit Profile
          </Button>
        </div>

        {bio && (
          <div className="mt-5 max-w-2xl">
            <p
              className={cn(
                'break-words text-sm leading-relaxed text-muted-foreground sm:text-base',
                !bioExpanded && 'line-clamp-2',
              )}
            >
              {bio}
            </p>
            {canExpandBio && (
              <button
                type="button"
                onClick={() => setBioExpanded(prev => !prev)}
                className="mt-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {bioExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-center md:hidden">
          <Button
            onClick={() => router.push('/profile/edit')}
            variant="outline"
            size="sm"
            icon={<Edit className="h-3.5 w-3.5" />}
            className="w-full sm:w-auto"
          >
            Edit Profile
          </Button>
        </div>
      </div>
    </section>
  );
}

