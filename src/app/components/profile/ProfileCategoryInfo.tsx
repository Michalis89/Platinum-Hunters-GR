'use client';

import EmptyState from '@/components/ui/empty';

type ProfileCategoryInfoProps = {
  category: string;
  categoryNotes: Record<string, unknown>;
};

function InfoRow({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  if (!children) {
    return null;
  }
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{children}</p>
    </div>
  );
}

function ChipList({ items, label }: Readonly<{ items: string[]; label: string }>) {
  if (!items?.length) {
    return null;
  }
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <span
            key={item}
            className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-medium text-foreground"
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
  categoryNotes,
}: Readonly<ProfileCategoryInfoProps>) {
  const notes = categoryNotes[category] as Record<string, unknown> | undefined;

  if (category === 'games') {
    // Read from category_profile.games (NEW SOURCE)
    const gamesNotes = notes as
      | {
          psn_id?: string;
          xbox_gamertag?: string;
          steam_id?: string;
          nintendo_id?: string;
          favorite_platform?: string;
          gaming_since?: number;
          user_favorite_genres?: string[];
        }
      | undefined;

    const hasGamingInfo =
      gamesNotes?.psn_id ||
      gamesNotes?.xbox_gamertag ||
      gamesNotes?.steam_id ||
      gamesNotes?.nintendo_id ||
      gamesNotes?.favorite_platform ||
      (gamesNotes?.user_favorite_genres && gamesNotes.user_favorite_genres.length > 0);

    if (!hasGamingInfo) {
      return <EmptyState title="No gaming details saved yet." size="sm" />;
    }

    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {gamesNotes?.psn_id && <InfoRow label="PSN ID">{gamesNotes.psn_id}</InfoRow>}
          {gamesNotes?.xbox_gamertag && (
            <InfoRow label="Xbox Gamertag">{gamesNotes.xbox_gamertag}</InfoRow>
          )}
          {gamesNotes?.steam_id && <InfoRow label="Steam ID">{gamesNotes.steam_id}</InfoRow>}
          {gamesNotes?.nintendo_id && (
            <InfoRow label="Nintendo ID">{gamesNotes.nintendo_id}</InfoRow>
          )}
          {gamesNotes?.favorite_platform && (
            <InfoRow label="Favorite Platform">{gamesNotes.favorite_platform}</InfoRow>
          )}
        </div>
        {gamesNotes?.user_favorite_genres && gamesNotes.user_favorite_genres.length > 0 && (
          <ChipList items={gamesNotes.user_favorite_genres} label="Favorite Genres" />
        )}
      </div>
    );
  }

  if (category === 'tv') {
    const tvNotes = notes as
      | {
          services?: string[];
          service_other?: string;
          genres?: string[];
          style?: string;
          since?: string | number;
          people?: string;
        }
      | undefined;

    if (!tvNotes) {
      return <EmptyState title="No TV details saved yet." size="sm" />;
    }

    return (
      <div className="space-y-4">
        {tvNotes.services?.length && (
          <ChipList items={tvNotes.services} label="Streaming Services" />
        )}
        {tvNotes.service_other && <InfoRow label="Other Service">{tvNotes.service_other}</InfoRow>}
        {tvNotes.genres?.length && <ChipList items={tvNotes.genres} label="Favorite Genres" />}
        {tvNotes.style && <InfoRow label="Watching Style">{tvNotes.style}</InfoRow>}
      </div>
    );
  }

  if (category === 'movies') {
    const moviesNotes = notes as
      | {
          services?: string[];
          service_other?: string;
          genres?: string[];
          style?: string;
          since?: string | number;
          directors?: string;
          actors?: string;
        }
      | undefined;

    if (!moviesNotes) {
      return <EmptyState title="No movie details saved yet." size="sm" />;
    }

    return (
      <div className="space-y-4">
        {moviesNotes.services?.length && (
          <ChipList items={moviesNotes.services} label="Streaming Services" />
        )}
        {moviesNotes.service_other && (
          <InfoRow label="Other Service">{moviesNotes.service_other}</InfoRow>
        )}
        {moviesNotes.genres?.length && (
          <ChipList items={moviesNotes.genres} label="Favorite Genres" />
        )}
        {moviesNotes.style && <InfoRow label="Watching Style">{moviesNotes.style}</InfoRow>}
      </div>
    );
  }

  if (category === 'anime') {
    const animeNotes = notes as
      | {
          platforms?: string[];
          platform_other?: string;
          genres?: string[];
          format?: string;
          since?: string | number;
          directors?: string;
          notes?: string;
        }
      | undefined;

    if (!animeNotes) {
      return <EmptyState title="No anime details saved yet." size="sm" />;
    }

    return (
      <div className="space-y-4">
        {animeNotes.platforms?.length && (
          <ChipList items={animeNotes.platforms} label="Platforms" />
        )}
        {animeNotes.platform_other && (
          <InfoRow label="Other Platform">{animeNotes.platform_other}</InfoRow>
        )}
        {animeNotes.genres?.length && (
          <ChipList items={animeNotes.genres} label="Favorite Genres" />
        )}
        {animeNotes.format && <InfoRow label="Watching Format">{animeNotes.format}</InfoRow>}
        {animeNotes.notes && <InfoRow label="Notes">{animeNotes.notes}</InfoRow>}
      </div>
    );
  }

  if (category === 'books') {
    const booksNotes = notes as
      | {
          genres?: string[];
          format?: string;
          since?: string | number;
          authors?: string;
          notes?: string;
        }
      | undefined;

    if (!booksNotes) {
      return <EmptyState title="No book details saved yet." size="sm" />;
    }

    return (
      <div className="space-y-4">
        {booksNotes.genres?.length && (
          <ChipList items={booksNotes.genres} label="Favorite Genres" />
        )}
        {booksNotes.format && <InfoRow label="Reading Format">{booksNotes.format}</InfoRow>}
        {booksNotes.notes && <InfoRow label="Notes">{booksNotes.notes}</InfoRow>}
      </div>
    );
  }

  if (category === 'manga') {
    const mangaNotes = notes as
      | {
          genres?: string[];
          format?: string;
          since?: string | number;
          authors?: string;
          notes?: string;
        }
      | undefined;

    if (!mangaNotes) {
      return <EmptyState title="No manga details saved yet." size="sm" />;
    }

    return (
      <div className="space-y-4">
        {mangaNotes.genres?.length && (
          <ChipList items={mangaNotes.genres} label="Favorite Genres" />
        )}
        {mangaNotes.format && <InfoRow label="Reading Format">{mangaNotes.format}</InfoRow>}
        {mangaNotes.notes && <InfoRow label="Notes">{mangaNotes.notes}</InfoRow>}
      </div>
    );
  }

  if (category === 'coding') {
    const codingNotes = notes as
      | {
          languages?: string[];
          focus?: string[];
          since?: string | number;
          tools?: string;
          notes?: string;
        }
      | undefined;

    if (!codingNotes) {
      return <EmptyState title="No coding details saved yet." size="sm" />;
    }

    return (
      <div className="space-y-4">
        {codingNotes.languages?.length && (
          <ChipList items={codingNotes.languages} label="Languages" />
        )}
        {codingNotes.focus?.length && <ChipList items={codingNotes.focus} label="Focus Areas" />}
        {codingNotes.tools && <InfoRow label="Tools / Stack">{codingNotes.tools}</InfoRow>}
        {codingNotes.notes && <InfoRow label="Notes">{codingNotes.notes}</InfoRow>}
      </div>
    );
  }

  if (category === 'pet') {
    const petNotes = notes as
      | {
          type?: string;
          name?: string;
          breed?: string;
          since?: string | number;
          notes?: string;
        }
      | undefined;

    if (!petNotes) {
      return <EmptyState title="No pet details saved yet." size="sm" />;
    }

    return (
      <div className="space-y-4">
        {petNotes.type && <InfoRow label="Type">{petNotes.type}</InfoRow>}
        {petNotes.name && <InfoRow label="Name">{petNotes.name}</InfoRow>}
        {petNotes.breed && <InfoRow label="Breed">{petNotes.breed}</InfoRow>}
        {petNotes.notes && <InfoRow label="Stories">{petNotes.notes}</InfoRow>}
      </div>
    );
  }

  if (category === 'vape') {
    const vapeNotes = notes as
      | {
          device?: string;
          nicotine?: string;
          since?: string | number;
          flavors?: string[];
          notes?: string;
        }
      | undefined;

    if (!vapeNotes) {
      return <EmptyState title="No vape details saved yet." size="sm" />;
    }

    return (
      <div className="space-y-4">
        {vapeNotes.device && <InfoRow label="Device">{vapeNotes.device}</InfoRow>}
        {vapeNotes.nicotine && <InfoRow label="Nicotine (mg)">{vapeNotes.nicotine}</InfoRow>}
        {vapeNotes.flavors?.length && <ChipList items={vapeNotes.flavors} label="Flavors" />}
        {vapeNotes.notes && <InfoRow label="Notes">{vapeNotes.notes}</InfoRow>}
      </div>
    );
  }

  return <EmptyState title="No details for this category yet." size="sm" />;
}
