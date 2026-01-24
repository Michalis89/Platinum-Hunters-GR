'use client';

import EmptyState from '@/app/components/ui/EmptyState';
import type { User } from '@/types/user';

type ProfileCategoryInfoProps = {
  category: string;
  user: User;
  categoryNotes: Record<string, unknown>;
};

function InfoRow({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  if (!children) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-[var(--hb-muted)]">{label}</p>
      <p className="text-sm text-[var(--hb-text)]">{children}</p>
    </div>
  );
}

function ChipList({ items, label }: Readonly<{ items: string[]; label: string }>) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="mb-2 text-xs text-[var(--hb-muted)]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1.5 text-xs font-medium text-[var(--hb-text)]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ProfileCategoryInfo({
  category,
  user,
  categoryNotes,
}: Readonly<ProfileCategoryInfoProps>) {
  const notes = categoryNotes[category] as Record<string, unknown> | undefined;

  const sectionTitle: Record<string, string> = {
    gaming: 'Gaming Πληροφορίες',
    anime: 'Anime Πληροφορίες',
    manga: 'Manga Πληροφορίες',
    movies: 'Movies Πληροφορίες',
    tv: 'TV Series Πληροφορίες',
    books: 'Books Πληροφορίες',
    coding: 'Coding Πληροφορίες',
    pet: 'Pet Πληροφορίες',
    vape: 'Vape Πληροφορίες',
  };

  // Gaming-specific info from user object
  if (category === 'gaming') {
    const hasGamingInfo =
      user.psn_id ||
      user.xbox_gamertag ||
      user.steam_id ||
      user.nintendo_id ||
      user.favorite_platform ||
      (user.favorite_genres && user.favorite_genres.length > 0) ||
      user.gaming_since;

    if (!hasGamingInfo) {
      return (
        <EmptyState
          title="Δεν υπάρχουν αποθηκευμένες πληροφορίες Gaming ακόμα."
          size="sm"
        />
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-primary-strong)]">
          {sectionTitle[category]}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {user.psn_id && <InfoRow label="PSN ID">{user.psn_id}</InfoRow>}
          {user.xbox_gamertag && <InfoRow label="Xbox Gamertag">{user.xbox_gamertag}</InfoRow>}
          {user.steam_id && <InfoRow label="Steam ID">{user.steam_id}</InfoRow>}
          {user.nintendo_id && <InfoRow label="Nintendo ID">{user.nintendo_id}</InfoRow>}
          {user.favorite_platform && (
            <InfoRow label="Αγαπημένη Κονσόλα">{user.favorite_platform}</InfoRow>
          )}
          {user.gaming_since && <InfoRow label="Gaming since">{user.gaming_since}</InfoRow>}
        </div>
        {user.favorite_genres && user.favorite_genres.length > 0 && (
          <ChipList items={user.favorite_genres} label="Αγαπημένα Genres" />
        )}
      </div>
    );
  }

  // TV-specific info
  if (category === 'tv') {
    const tvNotes = notes as {
      services?: string[];
      service_other?: string;
      genres?: string[];
      style?: string;
      since?: string | number;
      people?: string;
    } | undefined;

    if (!tvNotes) {
      return (
        <EmptyState
          title="Δεν υπάρχουν αποθηκευμένες πληροφορίες TV Series ακόμα."
          size="sm"
        />
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-primary-strong)]">
          {sectionTitle[category]}
        </p>
        {tvNotes.services?.length && <ChipList items={tvNotes.services} label="Αγαπημένες Πλατφόρμες" />}
        {tvNotes.service_other && <InfoRow label="Άλλη υπηρεσία">{tvNotes.service_other}</InfoRow>}
        {tvNotes.genres?.length && <ChipList items={tvNotes.genres} label="Αγαπημένα Genres" />}
        {tvNotes.style && <InfoRow label="Watching Style">{tvNotes.style}</InfoRow>}
        {tvNotes.since && <InfoRow label="Watching Since">{tvNotes.since}</InfoRow>}
        {tvNotes.people && <InfoRow label="Αγαπημένοι Ηθοποιοί / Σκηνοθέτες">{tvNotes.people}</InfoRow>}
      </div>
    );
  }

  // Movies-specific info
  if (category === 'movies') {
    const moviesNotes = notes as {
      services?: string[];
      service_other?: string;
      genres?: string[];
      style?: string;
      since?: string | number;
      directors?: string;
      actors?: string;
    } | undefined;

    if (!moviesNotes) {
      return (
        <EmptyState
          title="Δεν υπάρχουν αποθηκευμένες πληροφορίες Movies ακόμα."
          size="sm"
        />
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-primary-strong)]">
          {sectionTitle[category]}
        </p>
        {moviesNotes.services?.length && <ChipList items={moviesNotes.services} label="Αγαπημένες Πλατφόρμες" />}
        {moviesNotes.service_other && <InfoRow label="Άλλη υπηρεσία">{moviesNotes.service_other}</InfoRow>}
        {moviesNotes.genres?.length && <ChipList items={moviesNotes.genres} label="Αγαπημένα Genres" />}
        {moviesNotes.style && <InfoRow label="Watching Style">{moviesNotes.style}</InfoRow>}
        {moviesNotes.since && <InfoRow label="Watching Since">{moviesNotes.since}</InfoRow>}
        {moviesNotes.directors && <InfoRow label="Favorite Directors">{moviesNotes.directors}</InfoRow>}
        {moviesNotes.actors && <InfoRow label="Favorite Actors">{moviesNotes.actors}</InfoRow>}
      </div>
    );
  }

  // Anime-specific info
  if (category === 'anime') {
    const animeNotes = notes as {
      platforms?: string[];
      platform_other?: string;
      genres?: string[];
      format?: string;
      since?: string | number;
      directors?: string;
      notes?: string;
    } | undefined;

    if (!animeNotes) {
      return (
        <EmptyState
          title="Δεν υπάρχουν αποθηκευμένες πληροφορίες Anime ακόμα."
          size="sm"
        />
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-primary-strong)]">
          {sectionTitle[category]}
        </p>
        {animeNotes.platforms?.length && <ChipList items={animeNotes.platforms} label="Πλατφόρμες" />}
        {animeNotes.platform_other && <InfoRow label="Άλλη πλατφόρμα">{animeNotes.platform_other}</InfoRow>}
        {animeNotes.genres?.length && <ChipList items={animeNotes.genres} label="Αγαπημένα Genres" />}
        {animeNotes.format && <InfoRow label="Watching Format">{animeNotes.format}</InfoRow>}
        {animeNotes.since && <InfoRow label="Watching Since">{animeNotes.since}</InfoRow>}
        {animeNotes.directors && <InfoRow label="Directors / Studios">{animeNotes.directors}</InfoRow>}
        {animeNotes.notes && <InfoRow label="Notes">{animeNotes.notes}</InfoRow>}
      </div>
    );
  }

  // Books-specific info
  if (category === 'books') {
    const booksNotes = notes as {
      genres?: string[];
      format?: string;
      since?: string | number;
      authors?: string;
      notes?: string;
    } | undefined;

    if (!booksNotes) {
      return (
        <EmptyState
          title="Δεν υπάρχουν αποθηκευμένες πληροφορίες Books ακόμα."
          size="sm"
        />
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-primary-strong)]">
          {sectionTitle[category]}
        </p>
        {booksNotes.genres?.length && <ChipList items={booksNotes.genres} label="Αγαπημένα Genres" />}
        {booksNotes.format && <InfoRow label="Reading Format">{booksNotes.format}</InfoRow>}
        {booksNotes.since && <InfoRow label="Reading Since">{booksNotes.since}</InfoRow>}
        {booksNotes.authors && <InfoRow label="Favorite Authors">{booksNotes.authors}</InfoRow>}
        {booksNotes.notes && <InfoRow label="Notes">{booksNotes.notes}</InfoRow>}
      </div>
    );
  }

  // Manga-specific info
  if (category === 'manga') {
    const mangaNotes = notes as {
      genres?: string[];
      format?: string;
      since?: string | number;
      authors?: string;
      notes?: string;
    } | undefined;

    if (!mangaNotes) {
      return (
        <EmptyState
          title="Δεν υπάρχουν αποθηκευμένες πληροφορίες Manga ακόμα."
          size="sm"
        />
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-primary-strong)]">
          {sectionTitle[category]}
        </p>
        {mangaNotes.genres?.length && <ChipList items={mangaNotes.genres} label="Αγαπημένα Genres" />}
        {mangaNotes.format && <InfoRow label="Reading Format">{mangaNotes.format}</InfoRow>}
        {mangaNotes.since && <InfoRow label="Reading Since">{mangaNotes.since}</InfoRow>}
        {mangaNotes.authors && <InfoRow label="Favorite Mangaka">{mangaNotes.authors}</InfoRow>}
        {mangaNotes.notes && <InfoRow label="Notes">{mangaNotes.notes}</InfoRow>}
      </div>
    );
  }

  // Coding-specific info
  if (category === 'coding') {
    const codingNotes = notes as {
      languages?: string[];
      focus?: string[];
      since?: string | number;
      tools?: string;
      notes?: string;
    } | undefined;

    if (!codingNotes) {
      return (
        <EmptyState
          title="Δεν υπάρχουν αποθηκευμένες πληροφορίες Coding ακόμα."
          size="sm"
        />
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-primary-strong)]">
          {sectionTitle[category]}
        </p>
        {codingNotes.languages?.length && <ChipList items={codingNotes.languages} label="Γλώσσες" />}
        {codingNotes.focus?.length && <ChipList items={codingNotes.focus} label="Focus" />}
        {codingNotes.since && <InfoRow label="Coding Since">{codingNotes.since}</InfoRow>}
        {codingNotes.tools && <InfoRow label="Tools / Stack">{codingNotes.tools}</InfoRow>}
        {codingNotes.notes && <InfoRow label="Notes">{codingNotes.notes}</InfoRow>}
      </div>
    );
  }

  // Pet-specific info
  if (category === 'pet') {
    const petNotes = notes as {
      type?: string;
      name?: string;
      breed?: string;
      since?: string | number;
      notes?: string;
    } | undefined;

    if (!petNotes) {
      return (
        <EmptyState
          title="Δεν υπάρχουν αποθηκευμένες πληροφορίες Pet ακόμα."
          size="sm"
        />
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-primary-strong)]">
          {sectionTitle[category]}
        </p>
        {petNotes.type && <InfoRow label="Είδος">{petNotes.type}</InfoRow>}
        {petNotes.name && <InfoRow label="Όνομα">{petNotes.name}</InfoRow>}
        {petNotes.breed && <InfoRow label="Ράτσα">{petNotes.breed}</InfoRow>}
        {petNotes.since && <InfoRow label="Μαζί από">{petNotes.since}</InfoRow>}
        {petNotes.notes && <InfoRow label="Ιστορίες">{petNotes.notes}</InfoRow>}
      </div>
    );
  }

  // Vape-specific info
  if (category === 'vape') {
    const vapeNotes = notes as {
      device?: string;
      nicotine?: string;
      since?: string | number;
      flavors?: string[];
      notes?: string;
    } | undefined;

    if (!vapeNotes) {
      return (
        <EmptyState
          title="Δεν υπάρχουν αποθηκευμένες πληροφορίες Vape ακόμα."
          size="sm"
        />
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-primary-strong)]">
          {sectionTitle[category]}
        </p>
        {vapeNotes.device && <InfoRow label="Συσκευή">{vapeNotes.device}</InfoRow>}
        {vapeNotes.nicotine && <InfoRow label="Νικοτίνη (mg)">{vapeNotes.nicotine}</InfoRow>}
        {vapeNotes.since && <InfoRow label="Vaping Since">{vapeNotes.since}</InfoRow>}
        {vapeNotes.flavors?.length && <ChipList items={vapeNotes.flavors} label="Γεύσεις" />}
        {vapeNotes.notes && <InfoRow label="Notes">{vapeNotes.notes}</InfoRow>}
      </div>
    );
  }

  return null;
}
