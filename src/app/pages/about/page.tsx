import Image from 'next/image';
import { Sparkles, Users, HeartHandshake, Layers, MapPin, Gamepad2, User2 } from 'lucide-react';
import getSupabaseServer from '@/lib/supabase-server';

type TeamMember = {
  id: string;
  username: string;
  display_name: string | null;
  role: string;
  bio: string | null;
  avatar_url: string | null;
  country: string | null;
  favorite_platform: string | null;
};

const highlights = [
  {
    title: 'Μulti-hobby hub',
    desc: 'Ένα library για gaming, anime, manga, βιβλία, ταινίες, σειρές και projects.',
    icon: <Layers className="h-5 w-5 text-[var(--hb-primary-strong)]" />,
  },
  {
    title: 'Backlog & Progress',
    desc: 'Status, πρόοδος, σημειώσεις και achievements σε κοινά components.',
    icon: <Sparkles className="h-5 w-5 text-[var(--hb-primary-strong)]" />,
  },
  {
    title: 'Κοινότητα',
    desc: 'Authors/admins επιμελούνται guides, reviews και νέα features.',
    icon: <Users className="h-5 w-5 text-[var(--hb-primary-strong)]" />,
  },
  {
    title: 'Personal hub',
    desc: 'Ένα μέρος για όλα τα ενδιαφέροντά σου, χωρίς να χάνεις το focus.',
    icon: <HeartHandshake className="h-5 w-5 text-[var(--hb-primary-strong)]" />,
  },
];

async function getTeam(): Promise<TeamMember[]> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('users')
      .select('id,username,display_name,role,bio,avatar_url,country,favorite_platform')
      .in('role', ['admin', 'author'])
      .order('role', { ascending: true });

    if (error || !data) {
      console.error('Failed to load team', error);
      return [];
    }
    return data as TeamMember[];
  } catch (err) {
    console.error('Supabase server error', err);
    return [];
  }
}

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  author: 'Author',
};

export default async function AboutPage() {
  const team = await getTeam();
  return (
    <div className="relative min-h-screen bg-[var(--hb-bg)] text-[var(--hb-text)]">
      <div className="pointer-events-none absolute inset-0 opacity-70 blur-[90px]">
        <div className="absolute inset-0 bg-[var(--hb-gradient)]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-20">
        <div className="space-y-4 text-left">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--hb-muted)]">Σχετικά</p>
          <h1 className="bg-gradient-to-r from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl">
            Χομπίστας — το προσωπικό σου hobby hub.
          </h1>
          <p className="max-w-3xl text-lg text-[var(--hb-text)]/90">
            Ένας ενιαίος χώρος για να οργανώνεις όλα σου τα χόμπι: backlog, πρόοδο, σημειώσεις,
            reviews και στατιστικά — με κοινά components για κάθε κατηγορία.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {highlights.map(item => (
            <div
              key={item.title}
              className="flex flex-col gap-3 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 shadow-[0_12px_30px_rgba(3,7,18,0.35)] transition hover:-translate-y-1 hover:border-[var(--hb-primary-strong)]/60"
            >
              <div className="flex items-center gap-3 text-[var(--hb-headline)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                  {item.icon}
                </div>
                <h3 className="text-base font-semibold">{item.title}</h3>
              </div>
              <p className="text-sm text-[var(--hb-muted)]">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-[0_12px_30px_rgba(3,7,18,0.35)]">
          <h2 className="text-xl font-semibold text-[var(--hb-headline)]">Γιατί το κάνουμε</h2>
          <p className="mt-3 text-[var(--hb-text)]/90">
            Θέλουμε ένα καθαρό, γρήγορο και όμορφο μέρος για όλα τα hobbies. Ένα library που δεν
            είναι μόνο λίστα, αλλά εργαλείο: quick add, status, progress, notes και achievements.
            Με κοινά components ώστε κάθε κατηγορία να μοιράζεται την ίδια εμπειρία, προσαρμοσμένη
            στα δικά της πεδία.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--hb-muted)]">Ποιοι είμαστε</p>
            <h2 className="text-xl font-semibold text-[var(--hb-headline)]">
              Οι άνθρωποι πίσω από τον Χομπίστα
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {team.length === 0 ? (
              <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 text-[var(--hb-muted)]">
                Δεν βρέθηκαν μέλη ομάδας. Θα εμφανιστούν admins/authors από τη βάση.
              </div>
            ) : (
              team.map(member => (
                <div
                  key={member.id}
                  className="flex gap-3 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 shadow-[0_10px_30px_rgba(3,7,18,0.35)]"
                >
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white/5">
                    {member.avatar_url ? (
                      <Image
                        src={member.avatar_url}
                        alt={member.display_name || member.username}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[var(--hb-muted)]">
                        <User2 size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--hb-headline)]">
                          {member.display_name || member.username}
                        </span>
                        <span className="rounded-full border border-[var(--hb-border)] px-2 py-0.5 text-[11px] uppercase tracking-wide text-[var(--hb-primary-strong)]">
                          {roleLabel[member.role] || member.role}
                        </span>
                      </div>
                      {member.favorite_platform && (
                        <span className="flex items-center gap-1 text-[11px] text-[var(--hb-muted)]">
                          <Gamepad2 size={14} />
                          {member.favorite_platform}
                        </span>
                      )}
                    </div>
                    {member.bio && (
                      <p className="text-sm text-[var(--hb-muted)]">{member.bio}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-[var(--hb-muted)]">
                      <span>@{member.username}</span>
                      {member.country && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {member.country}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
