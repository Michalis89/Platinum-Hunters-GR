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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SelectField as Select } from '@/components/ui/select-field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CATEGORY_SERVICES,
  CODING_FOCUS,
  CODING_LANGUAGES,
  MOVIE_STYLES,
  PET_TYPES,
  PLATFORMS,
  TV_STYLES,
  VAPE_FLAVORS,
} from '@/data/hobbyConstants';

type ProfileCategoryTabsProps = {
  categories: string[];
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
  categoryNotes: Record<string, unknown>;
  petTypes: string[];
  onPetTypeToggle: (type: string) => void;
  onPetEntryField: (type: string, key: string, value: string) => void;
  onCategoryFieldChange: (cat: string, key: string, value: string | number | string[]) => void;
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
const MANGA_FORMATS = ['Physical', 'Digital', 'Webtoon', 'Mixed'];
const BOOK_FORMATS = ['Physical books', 'eBooks', 'Audiobooks', 'Mixed', 'Depends on the book'];
const GENRE_INSIGHTS_TOOLTIP = 'Genres are auto-generated from your Personal Insights.';
const NO_INSIGHTS_GENRES_MESSAGE = 'You should import some data in order to see the genres.';
const CATEGORY_TAB_ORDER = [
  'games',
  'anime',
  'manga',
  'movies',
  'tv',
  'books',
  'coding',
  'pet',
  'vape',
] as const;

function chipClass(active: boolean) {
  return `rounded-full border px-3 py-1 text-xs transition ${
    active
      ? `bg-primary/14 dark:bg-primary/22 border-primary/35 text-primary dark:border-primary/55 dark:text-[#8ec5ff]`
      : `hover:bg-primary/8 border-border bg-card text-muted-foreground hover:border-primary/35`
  }`;
}

export function ProfileCategoryTabs({
  categories,
  codingFavoriteLanguages,
  gameForm,
  vapeFallback,
  onGameFieldChange,
  onGamePlatformChange,
  categoryNotes,
  petTypes,
  onPetTypeToggle,
  onPetEntryField,
  onCategoryFieldChange,
  onCategoryListToggle,
}: ProfileCategoryTabsProps) {
  const orderedCategories = useMemo(() => {
    const enabled = categories.filter(category => TAB_LABELS[category]);
    return [...enabled].sort((a, b) => {
      const aIdx = CATEGORY_TAB_ORDER.indexOf(a as (typeof CATEGORY_TAB_ORDER)[number]);
      const bIdx = CATEGORY_TAB_ORDER.indexOf(b as (typeof CATEGORY_TAB_ORDER)[number]);
      const aRank = aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx;
      const bRank = bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx;
      return aRank - bRank;
    });
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

  const renderReadonlyGenres = (label: string, genres: string[]) => (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <label className="block text-sm font-medium text-foreground">{label}</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full text-muted-foreground opacity-80 transition-opacity hover:text-foreground hover:opacity-100"
              aria-label={`${label} info`}
            >
              <CircleHelp className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-72 text-sm">
            {GENRE_INSIGHTS_TOOLTIP}
          </PopoverContent>
        </Popover>
      </div>
      {genres.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {genres.map(genre => (
            <span
              key={`${label}-${genre}`}
              className="bg-primary/14 dark:bg-primary/22 rounded-full border border-primary/35 px-3 py-1 text-xs text-primary dark:border-primary/55 dark:text-[#8ec5ff]"
            >
              {genre}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{NO_INSIGHTS_GENRES_MESSAGE}</p>
      )}
    </div>
  );

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
                  <div className="space-y-4">
                    {renderReadonlyGenres(
                      'Favorite Genres',
                      Array.isArray(gameForm.favorite_genres)
                        ? gameForm.favorite_genres.map(String)
                        : [],
                    )}

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
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-sm font-medium text-foreground">Steam ID</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full text-muted-foreground opacity-80 transition-opacity hover:text-foreground hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                aria-label="Steam import tips"
                              >
                                <CircleHelp className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              side="top"
                              align="end"
                              className="w-80 max-w-[90vw] p-4"
                            >
                              <h4 className="text-sm font-semibold">Steam import tips</h4>
                              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                                <li>Use your SteamID64 (17 digits, e.g. 7656119...)</li>
                                <li>Vanity URLs and profile links are also supported</li>
                                <li>Your profile must be public during import</li>
                                <li>You can make it private again afterwards</li>
                              </ul>
                            </PopoverContent>
                          </Popover>
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
                  </div>
                )}

                {category === 'anime' && (
                  <div className="space-y-4">
                    {(() => {
                      const animeGenres =
                        Array.isArray(note.genres) && (note.genres as string[]).length > 0
                          ? (note.genres as string[])
                          : [];
                      const platformsList =
                        Array.isArray(note.platforms) && (note.platforms as string[]).length > 0
                          ? (note.platforms as string[])
                          : [];

                      return (
                        <>
                          {renderReadonlyGenres('Favorite Anime Genres', animeGenres)}

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
                        </>
                      );
                    })()}
                  </div>
                )}

                {category === 'manga' && (
                  <div className="space-y-4">
                    {(() => {
                      const mangaGenres =
                        Array.isArray(note.genres) && (note.genres as string[]).length > 0
                          ? (note.genres as string[])
                          : [];
                      return (
                        <>
                          {renderReadonlyGenres('Favorite Genres / Demographics', mangaGenres)}

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
                        </>
                      );
                    })()}
                  </div>
                )}

                {category === 'books' && (
                  <div className="space-y-4">
                    {(() => {
                      const bookGenres =
                        Array.isArray(note.genres) && (note.genres as string[]).length > 0
                          ? (note.genres as string[])
                          : [];
                      return (
                        <>
                          {renderReadonlyGenres('Favorite Book Genres', bookGenres)}

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
                        </>
                      );
                    })()}
                  </div>
                )}

                {category === 'movies' && (
                  <div className="space-y-4">
                    {(() => {
                      const movieGenres =
                        Array.isArray(note.genres) && (note.genres as string[]).length > 0
                          ? (note.genres as string[])
                          : [];
                      const serviceOptions = CATEGORY_SERVICES.movies || ['Other'];
                      const servicesList =
                        Array.isArray(note.services) && (note.services as string[]).length > 0
                          ? (note.services as string[])
                          : [];
                      return (
                        <>
                          {renderReadonlyGenres('Favorite Movie Genres', movieGenres)}

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
                                    onCategoryFieldChange('movies', 'service_other', e.target.value)
                                  }
                                  placeholder="e.g. local cinema app"
                                />
                              </div>
                            )}
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
                        </>
                      );
                    })()}
                  </div>
                )}

                {category === 'tv' && (
                  <div className="space-y-4">
                    {(() => {
                      const tvGenres =
                        Array.isArray(note.genres) && (note.genres as string[]).length > 0
                          ? (note.genres as string[])
                          : [];
                      const serviceOptions = CATEGORY_SERVICES.tv || ['Other'];
                      const services =
                        (note.services as string[] | undefined) && Array.isArray(note.services)
                          ? (note.services as string[])
                          : [];
                      return (
                        <>
                          {renderReadonlyGenres('Favorite TV Genres', tvGenres)}

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
                                    onClick={() => onCategoryListToggle('tv', 'services', service)}
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
                        </>
                      );
                    })()}
                  </div>
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

                            <Input
                              label="Tools / Stack"
                              type="text"
                              value={(note.tools as string) || ''}
                              onChange={e =>
                                onCategoryFieldChange('coding', 'tools', e.target.value)
                              }
                              placeholder="VS Code, Git, React..."
                            />
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
                          if (entry[key]) {
                            return entry[key];
                          }
                          if (type === String(note.type)) {
                            if (key === 'name') {
                              return String(note.name || '');
                            }
                            if (key === 'breed') {
                              return String(note.breed || '');
                            }
                            if (key === 'since') {
                              return String(note.since || '');
                            }
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
                                    <div className="grid gap-4 md:grid-cols-2">
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
