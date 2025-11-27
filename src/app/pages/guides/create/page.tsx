'use client';

import { useState } from 'react';
import { PageWrapper } from '@/app/components/layout/PageWrapper';
import { Button } from '@/app/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/Textarea';
import { Select } from '@/app/components/ui/Select';
import { TagsInput } from '@/app/components/ui/TagsInput';
import { SearchBar } from '@/app/components/ui/SearchBar';
import GameDetailsInfo from '@/app/components/game-details/GameDetailsInfo';
import { GuideStepsEditor } from '@/app/components/ui/GuideStepsEditor';
import { Trophy, TrophySidebar } from '@/app/components/ui/TrophySidebar';

interface GameDetailsInfoProps {
  readonly release_year?: number | null;
  readonly developer?: string | null;
  readonly publisher?: string | null;
  readonly genre?: string | null;
  readonly rating?: number | null;
  readonly metacritic?: number | null;
  readonly esrb_rating?: string | null;
}

export default function GuideCreatePage() {
  const [search, setSearch] = useState<string>('');
  const [gameDetails, setGameDetails] = useState<GameDetailsInfoProps | null>(null);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const RAWG_API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY!;

  const handleSearch = async () => {
    if (!search.trim()) return;

    try {
      const rawgRes = await fetch(
        `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(
          search,
        )}&page_size=1`,
      );
      const data = await rawgRes.json();
      const game = data.results?.[0];

      if (!game) {
        setGameDetails(null);
        setTrophies([]);
        return;
      }

      setGameDetails({
        release_year: game.released ? new Date(game.released).getFullYear() : null,
        developer: game.developers?.[0]?.name ?? null,
        publisher: game.publishers?.[0]?.name ?? null,
        genre: game.genres?.[0]?.name ?? null,
        rating: game.rating ?? null,
        metacritic: game.metacritic ?? null,
        esrb_rating: game.esrb_rating?.name ?? null,
      });

      // TODO: real NP communication id
      const npCommunicationId = 'NPWR00867_00';

      const res = await fetch(`/api/trophies?npCommunicationId=${npCommunicationId}`, {
        method: 'GET',
        cache: 'no-store',
      });
      const trophies = await res.json();

      console.log('trophies', trophies);
    } catch (error) {
      console.error('Κάτι πήγε στραβά:', error);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col-reverse gap-10 md:flex-row">
          {/* LEFT PANEL – MAIN CONTENT */}
          <div className="flex-1">
            <h1 className="mb-8 bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-3xl font-extrabold text-transparent">
              Δημιουργία Trophy Guide
            </h1>

            <form className="space-y-10">
              {/* GENERAL INFO */}
              <Card className="border-slate-800 bg-slate-900/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-100">
                    🎮 Γενικές Πληροφορίες
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Input
                    label="Τίτλος Guide"
                    placeholder="Platinum Walkthrough για το Elden Ring"
                  />

                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <SearchBar
                      value={search}
                      onChange={setSearch}
                      placeholder="Αναζήτηση παιχνιδιού..."
                    />
                    <Button type="button" onClick={handleSearch} className="whitespace-nowrap">
                      🔍 Αναζήτηση
                    </Button>
                  </div>

                  {gameDetails && (
                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                      <GameDetailsInfo {...gameDetails} />
                    </div>
                  )}

                  <Select label="Πλατφόρμα" options={['PS3', 'PS4', 'PS5', 'PC', 'XBOX']} />
                </CardContent>
              </Card>

              {/* PLATINUM STATS */}
              <Card className="border-slate-800 bg-slate-900/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-100">
                    🏆 Platinum Στατιστικά
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Input label="Βαθμός Δυσκολίας (1-10)" type="number" min={1} max={10} />
                  <Input label="Αριθμός Playthroughs" type="number" min={1} max={10} />
                  <Input label="Συνολικές Ώρες" type="number" />
                </CardContent>
              </Card>

              {/* GUIDE CONTENT */}
              <Card className="border-slate-800 bg-slate-900/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-100">
                    ✏️ Περιεχόμενο Guide
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Textarea label="Εισαγωγή" placeholder="Ξεκινήστε με μια σύντομη περιγραφή..." />
                  <GuideStepsEditor />
                </CardContent>
              </Card>

              {/* TAGS & SUBMIT */}
              <Card className="border-slate-800 bg-slate-900/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-100">
                    🏷️ Tags & Υποβολή
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <TagsInput />

                  <div className="flex flex-wrap gap-4">
                    <Button variant="secondary">💾 Αποθήκευση ως Draft</Button>
                    <Button variant="primary" type="submit">
                      🚀 Υποβολή Guide
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* RIGHT PANEL – TROPHY SIDEBAR */}
          <TrophySidebar
            trophies={trophies}
            iconSize={32}
            classNameIcon="shrink-0 w-8 h-8 flex items-center justify-center"
          />
        </div>
      </div>
    </PageWrapper>
  );
}
