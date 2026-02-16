'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CollapsibleCard,
  CollapsibleCardContent,
  CollapsibleCardHeader,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { SelectField as Select } from '@/components/ui/select-field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ANIME_GENRES,
  BOOK_GENRES,
  CATEGORY_SERVICES,
  CODING_FOCUS,
  CODING_LANGUAGES,
  GENRES,
  MOVIE_GENRES,
  MOVIE_STYLES,
  PET_TYPES,
  PLATFORMS,
  TV_GENRES,
  TV_STYLES,
  VAPE_FLAVORS,
} from '@/data/hobbyConstants';

type ProfileCategoryTabsProps = {
  categories: string[];
  animeFavoriteGenres: string[];
  movieFavoriteGenres: string[];
  bookFavoriteGenres: string[];
  codingFavoriteLanguages: string[];
  gameForm: {
    psn_id?: string | null;
    xbox_gamertag?: string | null;
    steam_id?: string | null;
    nintendo_id?: string | null;
    favorite_platform?: string | null;
    favorite_genres?: string[] | null;
    gaming_since?: string | number | null;
  };
  vapeFallback: {
    device?: string | null;
    flavor?: string | null;
  };
  onGameFieldChange: (name: string, value: string) => void;
  onGamePlatformChange: (value: string) => void;
  onGameGenreToggle: (genre: string) => void;
  categoryNotes: Record<string, unknown>;
  petTypes: string[];
  onPetTypeToggle: (type: string) => void;
  onPetEntryField: (type: string, key: string, value: string) => void;
  onCategoryFieldChange: (cat: string, key: string, value: string | number | string[]) => void;
  onCategoryGenreToggle: (cat: string, genre: string) => void;
  onCategoryListToggle: (cat: string, key: string, item: string) => void;
};

const TAB_LABELS: Record<string, string> = {
  games: 'Gaming',
  anime: 'Anime',
  manga: 'Manga',
  books: 'Books',
  movies: 'Movies',
  tv: 'TV Series',
  coding: 'Coding',
  pet: 'Pet',
  vape: 'Vape',
};

const ANIME_FORMATS = [
  'Binge watching',
  'Weekly episodes',
  'Only finished anime',
  'Movies only',
  'Mixed',
];
const ANIME_PLATFORMS = [
  'Crunchyroll',
  'Netflix',
  'Disney+',
  'Amazon Prime',
  'HIDIVE',
  'Blu-ray / Physical',
  'Other',
];
const MANGA_GENRES = [
  'Shonen',
  'Seinen',
  'Shojo',
  'Josei',
  'Fantasy',
  'Action',
  'Sci-Fi',
  'Romance',
];
const MANGA_FORMATS = ['Physical', 'Digital', 'Webtoon', 'Mixed'];
const BOOK_FORMATS = ['Physical books', 'eBooks', 'Audiobooks', 'Mixed', 'Depends on the book'];

function chipClass(active: boolean) {
  return `rounded-full border px-3 py-1 text-xs transition ${
    active
      ? `bg-primary/14 dark:bg-primary/22 border-primary/35 text-primary dark:border-primary/55 dark:text-[#8ec5ff]`
      : `hover:bg-primary/8 border-border bg-card text-muted-foreground hover:border-primary/35`
  }`;
}

export function ProfileCategoryTabs({
  categories,
  animeFavoriteGenres,
  movieFavoriteGenres,
  bookFavoriteGenres,
  codingFavoriteLanguages,
  gameForm,
  vapeFallback,
  onGameFieldChange,
  onGamePlatformChange,
  onGameGenreToggle,
  categoryNotes,
  petTypes,
  onPetTypeToggle,
  onPetEntryField,
  onCategoryFieldChange,
  onCategoryGenreToggle,
  onCategoryListToggle,
}: ProfileCategoryTabsProps) {
  const orderedCategories = useMemo(() => {
    const enabled = categories.filter(category => TAB_LABELS[category]);
    if (!enabled.includes('games')) return enabled;
    return ['games', ...enabled.filter(category => category !== 'games')];
  }, [categories]);

  const [activeCategory, setActiveCategory] = useState(orderedCategories[0] ?? '');

  useEffect(() => {
    if (!orderedCategories.length) {
      setActiveCategory('');
      return;
    }

    if (!orderedCategories.includes(activeCategory)) {
      setActiveCategory(orderedCategories[0]);
    }
  }, [orderedCategories, activeCategory]);

  const getNote = (cat: string) =>
    ((categoryNotes?.[cat] as Record<string, unknown> | undefined) || {}) as Record<
      string,
      unknown
    >;

  if (!orderedCategories.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Select at least one category to preview category tabs.
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
      <TabsList className="h-auto w-full justify-start overflow-x-auto">
        {orderedCategories.map(category => (
          <TabsTrigger key={category} value={category} className="capitalize">
            {TAB_LABELS[category]}
          </TabsTrigger>
        ))}
      </TabsList>

      {orderedCategories.map(category => {
        const note = getNote(category);
        return (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {String(TAB_LABELS[category] ?? category)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {category === 'games' && (
                  <CollapsibleCard className="">
                    <CollapsibleCardHeader className="border-b border-border bg-card/50">
                      <p className="mb-1 text-xs uppercase tracking-[0.25em] text-primary">
                        Gaming
                      </p>
                      <CardTitle className="text-lg text-foreground">Gaming Information</CardTitle>
                    </CollapsibleCardHeader>
                    <CollapsibleCardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Input
                          label="PSN ID"
                          type="text"
                          value={gameForm.psn_id || ''}
                          onChange={e => onGameFieldChange('psn_id', e.target.value)}
                          placeholder="YourPSNID"
                        />

                        <Input
                          label="Xbox Gamertag"
                          type="text"
                          value={gameForm.xbox_gamertag || ''}
                          onChange={e => onGameFieldChange('xbox_gamertag', e.target.value)}
                          placeholder="YourGamertag"
                        />

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-foreground">Steam ID</label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                                    aria-label="Steam ID help"
                                  >
                                    <CircleHelp className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-w-xs text-left leading-relaxed"
                                >
                                  Use your Steam ID from your profile. Prefer the 17-digit SteamID64
                                  (for example 7656119...). Vanity names and profile URLs are also
                                  accepted.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <input
                            type="text"
                            value={gameForm.steam_id || ''}
                            onChange={e => onGameFieldChange('steam_id', e.target.value)}
                            placeholder="76561198083126936 or steamcommunity.com/id/yourname"
                            className="w-full rounded-lg border border-border bg-card p-3 text-foreground transition placeholder:text-muted-foreground placeholder:opacity-80 focus:border-primary focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <Input
                          label="Nintendo ID"
                          type="text"
                          value={gameForm.nintendo_id || ''}
                          onChange={e => onGameFieldChange('nintendo_id', e.target.value)}
                          placeholder="YourNintendoID"
                        />
                      </div>

                      <Select
                        label="Favorite Platform"
                        options={['', ...PLATFORMS]}
                        value={String(gameForm.favorite_platform || '')}
                        onChange={onGamePlatformChange}
                      />

                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                          Favorite Genres
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {GENRES.map(genre => {
                            const active = (gameForm.favorite_genres || []).includes(genre);
                            return (
                              <Button
                                type="button"
                                key={genre}
                                onClick={() => onGameGenreToggle(genre)}
                                className={`rounded-full border px-3 py-1 text-xs transition ${
                                  active
                                    ? `bg-primary/14 dark:bg-primary/22 border-primary/35 text-primary dark:border-primary/55 dark:text-[#8ec5ff]`
                                    : `hover:bg-primary/8 border-border bg-card text-muted-foreground hover:border-primary/35`
                                }`}
                              >
                                {genre}
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      <Input
                        label="Gaming Since (Year)"
                        type="number"
                        value={String(gameForm.gaming_since ?? '')}
                        onChange={e => onGameFieldChange('gaming_since', e.target.value)}
                        placeholder="2005"
                        min="1970"
                        max={new Date().getFullYear()}
                      />
                    </CollapsibleCardContent>
                  </CollapsibleCard>
                )}

                {category === 'anime' && (
                  <div className="space-y-4">
                    {(() => {
                      const animeGenres =
                        Array.isArray(note.genres) && (note.genres as string[]).length > 0
                          ? (note.genres as string[])
                          : animeFavoriteGenres;
                      const platformsList =
                        Array.isArray(note.platforms) && (note.platforms as string[]).length > 0
                          ? (note.platforms as string[])
                          : [];

                      return (
                        <>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">
                              Favorite Anime Genres
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {ANIME_GENRES.map(genre => {
                                const active = animeGenres.includes(genre);
                                return (
                                  <Button
                                    type="button"
                                    key={genre}
                                    onClick={() => onCategoryGenreToggle('anime', genre)}
                                    className={chipClass(active)}
                                  >
                                    {genre}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">
                              Preferred Watching Format
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {ANIME_FORMATS.map(format => {
                                const active = note.format === format;
                                return (
                                  <Button
                                    type="button"
                                    key={format}
                                    onClick={() =>
                                      onCategoryFieldChange('anime', 'format', String(format))
                                    }
                                    className={chipClass(active)}
                                  >
                                    {format}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">
                              Preferred Source / Platform
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {ANIME_PLATFORMS.map(platform => {
                                const active = platformsList.includes(platform);
                                return (
                                  <Button
                                    type="button"
                                    key={platform}
                                    onClick={() =>
                                      onCategoryListToggle('anime', 'platforms', platform)
                                    }
                                    className={chipClass(active)}
                                  >
                                    {platform}
                                  </Button>
                                );
                              })}
                            </div>
                            {platformsList.includes('Other') && (
                              <div className="mt-3">
                                <Input
                                  label="Other platform"
                                  value={(note.platform_other as string) || ''}
                                  onChange={e =>
                                    onCategoryFieldChange('anime', 'platform_other', e.target.value)
                                  }
                                  placeholder="e.g. local streaming app"
                                />
                              </div>
                            )}
                          </div>

                          <Input
                            label="Watching Anime Since (Year)"
                            type="number"
                            value={(note.since as string | number | undefined) || ''}
                            onChange={e => onCategoryFieldChange('anime', 'since', e.target.value)}
                            placeholder="e.g. 2004"
                            min="1970"
                            max={new Date().getFullYear()}
                          />

                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">
                              Favorite Anime Directors / Studios
                            </label>
                            <Textarea
                              value={(note.directors as string) || ''}
                              onChange={e =>
                                onCategoryFieldChange('anime', 'directors', e.target.value)
                              }
                              placeholder="Favorite directors / studios (e.g. Miyazaki, Ufotable)"
                              rows={3}
                            />
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {category === 'manga' && (
                  <CollapsibleCard className="">
                    <CollapsibleCardHeader>
                      <CardTitle className="text-foreground">Manga Information</CardTitle>
                    </CollapsibleCardHeader>
                    <CollapsibleCardContent className="space-y-4">
                      {(() => {
                        const mangaGenres =
                          Array.isArray(note.genres) && (note.genres as string[]).length > 0
                            ? (note.genres as string[])
                            : animeFavoriteGenres;
                        return (
                          <>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                Favorite Genres / Demographics
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {MANGA_GENRES.map(genre => {
                                  const active = mangaGenres.includes(genre);
                                  return (
                                    <Button
                                      type="button"
                                      key={genre}
                                      onClick={() => onCategoryGenreToggle('manga', genre)}
                                      className={`rounded-full border px-3 py-1 text-xs transition ${
                                        active
                                          ? `bg-primary/14 dark:bg-primary/22 border-primary/35 text-primary dark:border-primary/55 dark:text-[#8ec5ff]`
                                          : `hover:bg-primary/8 border-border bg-card text-muted-foreground hover:border-primary/35`
                                      }`}
                                    >
                                      {genre}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                Preferred Reading Format
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {MANGA_FORMATS.map(format => {
                                  const active = note.format === format;
                                  return (
                                    <Button
                                      type="button"
                                      key={format}
                                      onClick={() =>
                                        onCategoryFieldChange('manga', 'format', String(format))
                                      }
                                      className={`rounded-full border px-3 py-1 text-xs transition ${
                                        active
                                          ? `bg-primary/14 dark:bg-primary/22 border-primary/35 text-primary dark:border-primary/55 dark:text-[#8ec5ff]`
                                          : `hover:bg-primary/8 border-border bg-card text-muted-foreground hover:border-primary/35`
                                      }`}
                                    >
                                      {format}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>

                            <Input
                              label="Reading Manga Since (Year)"
                              type="number"
                              value={(note.since as string | number | undefined) || ''}
                              onChange={e =>
                                onCategoryFieldChange('manga', 'since', e.target.value)
                              }
                              placeholder="e.g. 2018"
                              min="1970"
                              max={new Date().getFullYear()}
                            />

                            <div className="space-y-1.5">
                              <label className="text-sm font-medium text-foreground">
                                Favorite Mangaka / Artists
                              </label>
                              <Textarea
                                value={(note.authors as string) || ''}
                                onChange={e =>
                                  onCategoryFieldChange('manga', 'authors', e.target.value)
                                }
                                placeholder="Favorite mangaka / artists"
                                rows={3}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </CollapsibleCardContent>
                  </CollapsibleCard>
                )}

                {category === 'books' && (
                  <CollapsibleCard className="">
                    <CollapsibleCardHeader>
                      <CardTitle className="text-foreground">Books Information</CardTitle>
                    </CollapsibleCardHeader>
                    <CollapsibleCardContent className="space-y-4">
                      {(() => {
                        const bookGenres =
                          Array.isArray(note.genres) && (note.genres as string[]).length > 0
                            ? (note.genres as string[])
                            : bookFavoriteGenres;
                        return (
                          <>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                Favorite Book Genres
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {BOOK_GENRES.map(genre => {
                                  const active = bookGenres.includes(genre);
                                  return (
                                    <Button
                                      type="button"
                                      key={genre}
                                      onClick={() => onCategoryGenreToggle('books', genre)}
                                      className={chipClass(active)}
                                    >
                                      {genre}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                Preferred Reading Format
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {BOOK_FORMATS.map(format => {
                                  const active = note.format === format;
                                  return (
                                    <Button
                                      type="button"
                                      key={format}
                                      onClick={() =>
                                        onCategoryFieldChange('books', 'format', String(format))
                                      }
                                      className={chipClass(active)}
                                    >
                                      {format}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>

                            <Input
                              label="Reading Since (Year)"
                              type="number"
                              value={(note.since as string | number | undefined) || ''}
                              onChange={e =>
                                onCategoryFieldChange('books', 'since', e.target.value)
                              }
                              placeholder="e.g. 2001"
                              min="1970"
                              max={new Date().getFullYear()}
                            />

                            <div className="space-y-1.5">
                              <label className="text-sm font-medium text-foreground">
                                Favorite Authors
                              </label>
                              <Textarea
                                value={(note.authors as string) || ''}
                                onChange={e =>
                                  onCategoryFieldChange('books', 'authors', e.target.value)
                                }
                                placeholder="Favorite authors"
                                rows={3}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </CollapsibleCardContent>
                  </CollapsibleCard>
                )}

                {category === 'movies' && (
                  <CollapsibleCard className="">
                    <CollapsibleCardHeader>
                      <CardTitle className="text-foreground">Movies Information</CardTitle>
                    </CollapsibleCardHeader>
                    <CollapsibleCardContent className="space-y-4">
                      {(() => {
                        const movieGenres =
                          Array.isArray(note.genres) && (note.genres as string[]).length > 0
                            ? (note.genres as string[])
                            : movieFavoriteGenres;
                        const serviceOptions = CATEGORY_SERVICES.movies || ['Other'];
                        const servicesList =
                          Array.isArray(note.services) && (note.services as string[]).length > 0
                            ? (note.services as string[])
                            : [];
                        return (
                          <>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                Favorite Streaming / Watching Platforms
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {serviceOptions.map(service => {
                                  const active = servicesList.includes(service);
                                  return (
                                    <Button
                                      type="button"
                                      key={service}
                                      onClick={() =>
                                        onCategoryListToggle('movies', 'services', service)
                                      }
                                      className={`rounded-full border px-3 py-1 text-xs transition ${
                                        active
                                          ? `bg-primary/14 dark:bg-primary/22 border-primary/35 text-primary dark:border-primary/55 dark:text-[#8ec5ff]`
                                          : `hover:bg-primary/8 border-border bg-card text-muted-foreground hover:border-primary/35`
                                      }`}
                                    >
                                      {service}
                                    </Button>
                                  );
                                })}
                              </div>
                              {servicesList.includes('Other') && (
                                <div className="mt-3">
                                  <Input
                                    label="Other service"
                                    value={(note.service_other as string) || ''}
                                    onChange={e =>
                                      onCategoryFieldChange(
                                        'movies',
                                        'service_other',
                                        e.target.value,
                                      )
                                    }
                                    placeholder="e.g. local cinema app"
                                  />
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                Favorite Movie Genres
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {MOVIE_GENRES.map(genre => {
                                  const active = movieGenres.includes(genre);
                                  return (
                                    <Button
                                      type="button"
                                      key={genre}
                                      onClick={() => onCategoryGenreToggle('movies', genre)}
                                      className={`rounded-full border px-3 py-1 text-xs transition ${
                                        active
                                          ? `bg-primary/14 dark:bg-primary/22 border-primary/35 text-primary dark:border-primary/55 dark:text-[#8ec5ff]`
                                          : `hover:bg-primary/8 border-border bg-card text-muted-foreground hover:border-primary/35`
                                      }`}
                                    >
                                      {genre}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                Preferred Watching Style
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {MOVIE_STYLES.map(style => {
                                  const active = note.style === style;
                                  return (
                                    <Button
                                      type="button"
                                      key={style}
                                      onClick={() =>
                                        onCategoryFieldChange('movies', 'style', String(style))
                                      }
                                      className={`rounded-full border px-3 py-1 text-xs transition ${
                                        active
                                          ? `bg-primary/14 dark:bg-primary/22 border-primary/35 text-primary dark:border-primary/55 dark:text-[#8ec5ff]`
                                          : `hover:bg-primary/8 border-border bg-card text-muted-foreground hover:border-primary/35`
                                      }`}
                                    >
                                      {style}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>

                            <Input
                              label="Watching Movies Since (Year)"
                              type="number"
                              value={(note.since as string | number | undefined) || ''}
                              onChange={e =>
                                onCategoryFieldChange('movies', 'since', e.target.value)
                              }
                              placeholder="e.g. 2008"
                              min="1970"
                              max={new Date().getFullYear()}
                            />

                            <div className="space-y-1.5">
                              <label className="text-sm font-medium text-foreground">
                                Favorite Actors / Directors
                              </label>
                              <Textarea
                                value={(note.people as string) || ''}
                                onChange={e =>
                                  onCategoryFieldChange('movies', 'people', e.target.value)
                                }
                                placeholder="Favorite actors or directors that inspire you"
                                rows={3}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </CollapsibleCardContent>
                  </CollapsibleCard>
                )}

                {category === 'tv' && (
                  <CollapsibleCard className="">
                    <CollapsibleCardHeader>
                      <CardTitle className="text-foreground">TV Series Information</CardTitle>
                    </CollapsibleCardHeader>
                    <CollapsibleCardContent className="space-y-4">
                      {(() => {
                        const tvGenres =
                          Array.isArray(note.genres) && (note.genres as string[]).length > 0
                            ? (note.genres as string[])
                            : movieFavoriteGenres;
                        const serviceOptions = CATEGORY_SERVICES.tv || ['Other'];
                        const services =
                          (note.services as string[] | undefined) && Array.isArray(note.services)
                            ? (note.services as string[])
                            : [];
                        return (
                          <>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                Favorite Streaming Platforms
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {serviceOptions.map(service => {
                                  const active = services.includes(service);
                                  return (
                                    <Button
                                      type="button"
                                      key={service}
                                      onClick={() =>
                                        onCategoryListToggle('tv', 'services', service)
                                      }
                                      className={chipClass(active)}
                                    >
                                      {service}
                                    </Button>
                                  );
                                })}
                              </div>
                              {services.includes('Other') && (
                                <div className="mt-3">
                                  <Input
                                    label="Other service"
                                    value={(note.service_other as string) || ''}
                                    onChange={e =>
                                      onCategoryFieldChange('tv', 'service_other', e.target.value)
                                    }
                                    placeholder="e.g. Cosmote TV"
                                  />
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                Favorite TV Genres
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {TV_GENRES.map(genre => {
                                  const active = tvGenres.includes(genre);
                                  return (
                                    <Button
                                      type="button"
                                      key={genre}
                                      onClick={() => onCategoryGenreToggle('tv', genre)}
                                      className={chipClass(active)}
                                    >
                                      {genre}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                Preferred Watching Style
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {TV_STYLES.map(style => {
                                  const active = note.style === style;
                                  return (
                                    <Button
                                      type="button"
                                      key={style}
                                      onClick={() =>
                                        onCategoryFieldChange('tv', 'style', String(style))
                                      }
                                      className={chipClass(active)}
                                    >
                                      {style}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>

                            <Input
                              label="Watching Since (Year)"
                              type="number"
                              value={(note.since as string | number | undefined) || ''}
                              onChange={e => onCategoryFieldChange('tv', 'since', e.target.value)}
                              placeholder="e.g. 2010"
                              min="1970"
                              max={new Date().getFullYear()}
                            />

                            <div className="space-y-1.5">
                              <label className="text-sm font-medium text-foreground">
                                Favorite Actors / Directors
                              </label>
                              <Textarea
                                value={(note.people as string) || ''}
                                onChange={e =>
                                  onCategoryFieldChange('tv', 'people', e.target.value)
                                }
                                placeholder="Favorite actors/directors or extra notes."
                                rows={3}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </CollapsibleCardContent>
                  </CollapsibleCard>
                )}

                {category === 'coding' && (
                  <CollapsibleCard className="">
                    <CollapsibleCardHeader>
                      <CardTitle className="text-foreground">Coding Information</CardTitle>
                    </CollapsibleCardHeader>
                    <CollapsibleCardContent className="space-y-4">
                      {(() => {
                        const codingLanguages =
                          Array.isArray(note.languages) && (note.languages as string[]).length > 0
                            ? (note.languages as string[])
                            : codingFavoriteLanguages;
                        return (
                          <>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                Languages you use
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {CODING_LANGUAGES.map(lang => {
                                  const active = codingLanguages.includes(lang);
                                  return (
                                    <Button
                                      type="button"
                                      key={lang}
                                      onClick={() =>
                                        onCategoryListToggle('coding', 'languages', lang)
                                      }
                                      className={chipClass(active)}
                                    >
                                      {lang}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                Focus
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {CODING_FOCUS.map(focus => {
                                  const list =
                                    (note.focus as string[] | undefined) &&
                                    Array.isArray(note.focus)
                                      ? (note.focus as string[])
                                      : [];
                                  const active = list.includes(focus);
                                  return (
                                    <Button
                                      type="button"
                                      key={focus}
                                      onClick={() => onCategoryListToggle('coding', 'focus', focus)}
                                      className={chipClass(active)}
                                    >
                                      {focus}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <Input
                                label="Coding Since (Year)"
                                type="number"
                                value={(note.since as string) || ''}
                                onChange={e =>
                                  onCategoryFieldChange('coding', 'since', e.target.value)
                                }
                                placeholder="2012"
                                min="1970"
                                max={new Date().getFullYear()}
                              />
                              <Input
                                label="Tools / Stack"
                                type="text"
                                value={(note.tools as string) || ''}
                                onChange={e =>
                                  onCategoryFieldChange('coding', 'tools', e.target.value)
                                }
                                placeholder="VS Code, Git, React..."
                              />
                            </div>
                          </>
                        );
                      })()}
                    </CollapsibleCardContent>
                  </CollapsibleCard>
                )}

                {category === 'pet' && (
                  <CollapsibleCard className="">
                    <CollapsibleCardHeader>
                      <CardTitle className="text-foreground">Pet Information</CardTitle>
                    </CollapsibleCardHeader>
                    <CollapsibleCardContent className="space-y-4">
                      {(() => {
                        const petSelection = petTypes || [];
                        const fallbackType = note.type ? [String(note.type)] : [];
                        const activePetTypes =
                          petSelection.length > 0 ? petSelection : fallbackType;
                        const petEntries =
                          (note.entries as Record<string, Record<string, string>> | undefined) ||
                          {};
                        const getPetEntryValue = (type: string, key: string) => {
                          const entry = petEntries[type] || {};
                          if (entry[key]) return entry[key];
                          if (type === String(note.type)) {
                            if (key === 'name') return String(note.name || '');
                            if (key === 'breed') return String(note.breed || '');
                            if (key === 'since') return String(note.since || '');
                          }
                          return '';
                        };

                        return (
                          <>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                Pet Types
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {PET_TYPES.map(type => {
                                  const active = petSelection.includes(type);
                                  return (
                                    <Button
                                      type="button"
                                      key={`pet-type-${type}`}
                                      onClick={() => onPetTypeToggle(type)}
                                      className={chipClass(active)}
                                    >
                                      {type}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>

                            {activePetTypes.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Select a pet type to save pet details.
                              </p>
                            ) : (
                              <div className="space-y-4">
                                {activePetTypes.map(type => (
                                  <div
                                    key={`pet-entry-${type}`}
                                    className="space-y-3 rounded-lg border bg-card/70 px-4 py-3"
                                  >
                                    <p className="text-sm font-semibold text-foreground">
                                      {String(type)}
                                    </p>
                                    <div className="grid gap-4 md:grid-cols-3">
                                      <Input
                                        label={`Name (${type})`}
                                        type="text"
                                        value={getPetEntryValue(type, 'name')}
                                        onChange={e =>
                                          onPetEntryField(type, 'name', e.target.value)
                                        }
                                        placeholder={`Name for ${type.toLowerCase()}`}
                                      />
                                      <Input
                                        label="Breed"
                                        type="text"
                                        value={getPetEntryValue(type, 'breed')}
                                        onChange={e =>
                                          onPetEntryField(type, 'breed', e.target.value)
                                        }
                                        placeholder="e.g. Labrador"
                                      />
                                      <Input
                                        label="Since (Year)"
                                        type="number"
                                        value={getPetEntryValue(type, 'since')}
                                        onChange={e =>
                                          onPetEntryField(type, 'since', e.target.value)
                                        }
                                        placeholder="2019"
                                        min="1970"
                                        max={new Date().getFullYear()}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </CollapsibleCardContent>
                  </CollapsibleCard>
                )}

                {category === 'vape' && (
                  <CollapsibleCard className="">
                    <CollapsibleCardHeader>
                      <CardTitle className="text-foreground">Vape Information</CardTitle>
                    </CollapsibleCardHeader>
                    <CollapsibleCardContent className="space-y-4">
                      {(() => {
                        const vapeDeviceValue =
                          (note.device as string) || String(vapeFallback.device || '');
                        const fallbackFlavor = vapeFallback.flavor
                          ? [String(vapeFallback.flavor)]
                          : [];
                        const vapeFlavors =
                          Array.isArray(note.flavors) && (note.flavors as string[]).length > 0
                            ? (note.flavors as string[])
                            : fallbackFlavor;
                        return (
                          <>
                            <div className="grid gap-4 md:grid-cols-2">
                              <Input
                                label="Device"
                                type="text"
                                value={vapeDeviceValue}
                                onChange={e =>
                                  onCategoryFieldChange('vape', 'device', e.target.value)
                                }
                                placeholder="e.g. Berserker B3"
                              />
                              <Input
                                label="Nicotine (mg)"
                                type="number"
                                value={(note.nicotine as string) || ''}
                                onChange={e =>
                                  onCategoryFieldChange('vape', 'nicotine', e.target.value)
                                }
                                placeholder="3"
                                min="0"
                                max="50"
                              />
                              <Input
                                label="Vaping Since (Year)"
                                type="number"
                                value={(note.since as string) || ''}
                                onChange={e =>
                                  onCategoryFieldChange('vape', 'since', e.target.value)
                                }
                                placeholder="2018"
                                min="1970"
                                max={new Date().getFullYear()}
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                Favorite Flavors
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {VAPE_FLAVORS.map(flavor => {
                                  const active = vapeFlavors.includes(flavor);
                                  return (
                                    <Button
                                      type="button"
                                      key={flavor}
                                      onClick={() =>
                                        onCategoryListToggle('vape', 'flavors', flavor)
                                      }
                                      className={chipClass(active)}
                                    >
                                      {flavor}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </CollapsibleCardContent>
                  </CollapsibleCard>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
