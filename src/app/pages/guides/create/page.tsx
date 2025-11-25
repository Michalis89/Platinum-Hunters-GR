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

interface TrophyData {
  trophyId: number;
  trophyType: string;
  trophyName: string;
  trophyDetail: string;
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
        `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(search)}&page_size=1`,
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
      <div className="flex flex-col-reverse gap-8 md:flex-row">
        <div className="flex-1">
          <h1 className="mb-6 text-2xl font-bold text-white">Δημιουργία Guide</h1>

          <form className="space-y-8">
            {/* General Info */}
            <Card>
              <CardHeader>
                <CardTitle>Γενικές Πληροφορίες</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input label="Τίτλος Guide" placeholder="Platinum Walkthrough για το God of War" />
                <div className="flex items-center gap-4">
                  <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Αναζήτηση παιχνιδιού..."
                  />
                  <Button type="button" onClick={handleSearch}>
                    Αναζήτηση
                  </Button>
                </div>
                {gameDetails && <GameDetailsInfo {...gameDetails} />}
                <Select label="Πλατφόρμα" options={['PS3', 'PS4', 'PS5', 'PC', 'XBOX']} />
              </CardContent>
            </Card>

            {/* Platinum Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Platinum Στατιστικά</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input label="Βαθμός Δυσκολίας (1-10)" type="number" min={1} max={10} />
                <Input
                  label="Πόσα Playthroughts θέλει για την πλατίνα"
                  type="number"
                  min={1}
                  max={10}
                />
                <Input label="Ώρες για Platinum" type="number" />
              </CardContent>
            </Card>

            {/* Guide Content */}
            <Card>
              <CardHeader>
                <CardTitle>Περιεχόμενο</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea label="Εισαγωγή" />
                <GuideStepsEditor />
              </CardContent>
            </Card>

            {/* Tags & Submit */}
            <Card>
              <CardHeader>
                <CardTitle>Tags & Υποβολή</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <TagsInput />
                <div className="space-x-4">
                  <Button variant="secondary">Αποθήκευση ως Draft</Button>
                  <Button variant="primary" type="submit">
                    Υποβολή Guide
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
        <TrophySidebar
          trophies={trophies}
          iconSize={32}
          classNameIcon="shrink-0 w-8 h-8 flex items-center justify-center"
        />
      </div>
    </PageWrapper>
  );
}
