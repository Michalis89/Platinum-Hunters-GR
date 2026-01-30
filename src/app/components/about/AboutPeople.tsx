import Image from 'next/image';
import { User2, MapPin, Gamepad2 } from 'lucide-react';
import EmptyState from '@/app/components/ui/EmptyState';

export type TeamMember = {
  id: string;
  username: string;
  display_name: string | null;
  role: string;
  roles?: string[] | null;
  bio: string | null;
  avatar_url: string | null;
  country: string | null;
  favorite_platform: string | null;
};

type AboutPeopleProps = {
  team: TeamMember[];
};

const roleLabel: Record<string, string> = {
  owner: 'Founder',
  admin: 'Admin',
  moderator: 'Moderator',
  author: 'Author',
  reviewer: 'Reviewer',
};

const roleColors: Record<string, string> = {
  owner: 'border-[var(--hb-primary-strong)]/60 text-[var(--hb-primary-strong)]',
  admin: 'border-[var(--hb-primary-strong)]/45 text-[var(--hb-primary-strong)]',
  moderator: 'border-sky-500/40 text-sky-400',
  reviewer: 'border-amber-500/40 text-amber-400',
  author: 'border-[var(--hb-border)] text-[var(--hb-muted)]',
};

const ROLE_PRIORITY = ['owner', 'admin', 'moderator', 'author', 'reviewer', 'user'];

const getDisplayRole = (member: TeamMember) => {
  const roles = Array.isArray(member.roles) ? member.roles : [];
  const roleFromArray = ROLE_PRIORITY.find(role => roles.includes(role));
  return roleFromArray ?? member.role;
};

export function AboutPeople({ team }: AboutPeopleProps) {
  const sortedTeam = [...team].sort((a, b) => {
    const roleA = getDisplayRole(a);
    const roleB = getDisplayRole(b);
    const rankA = ROLE_PRIORITY.indexOf(roleA);
    const rankB = ROLE_PRIORITY.indexOf(roleB);
    if (rankA !== rankB) {
      return (rankA === -1 ? ROLE_PRIORITY.length : rankA) -
        (rankB === -1 ? ROLE_PRIORITY.length : rankB);
    }
    return (a.display_name || a.username).localeCompare(b.display_name || b.username, 'el');
  });

  return (
    <section className="px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
            Η ομάδα
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[var(--hb-headline)] md:text-4xl">
            Οι άνθρωποι πίσω από τον Χομπίστα
          </h2>
          <p className="mx-auto max-w-xl text-[var(--hb-muted)]">
            Μια μικρή ομάδα hobbyists που αγαπάει τα games, το anime, τις ταινίες — και θέλει να
            φτιάξει το καλύτερο εργαλείο για τους υπόλοιπους.
          </p>
        </div>

        {team.length === 0 ? (
          <EmptyState
            title="Δεν βρέθηκαν μέλη ομάδας."
            description="Τα admins και authors θα εμφανιστούν εδώ."
            size="sm"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {sortedTeam.map(member => (
              <div
                key={member.id}
                className="hover:border-[var(--hb-primary-strong)]/40 group flex gap-4 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-5 transition"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
                  {member.avatar_url ? (
                    <Image
                      src={member.avatar_url}
                      alt={member.display_name || member.username}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--hb-muted)]">
                      <User2 className="h-7 w-7" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[var(--hb-headline)]">
                      {member.display_name || member.username}
                    </span>
                    {(() => {
                      const displayRole = getDisplayRole(member);
                      return (
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                            roleColors[displayRole] || roleColors.author
                          }`}
                        >
                          {roleLabel[displayRole] || displayRole}
                        </span>
                      );
                    })()}
                  </div>

                  {member.bio && (
                    <p className="text-sm leading-relaxed text-[var(--hb-muted)]">{member.bio}</p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-[var(--hb-muted)]">
                    <span className="opacity-70">@{member.username}</span>
                    {member.country && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {member.country}
                      </span>
                    )}
                    {member.favorite_platform && (
                      <span className="flex items-center gap-1">
                        <Gamepad2 className="h-3 w-3" />
                        {member.favorite_platform}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
