'use client';

import { useMemo, useState } from 'react';
import { PageWrapper } from '@/app/components/layout/PageWrapper';
import { Button } from '@/app/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { TagsInput } from '@/app/components/ui/TagsInput';
import { SearchBar } from '@/app/components/ui/SearchBar';
import Feedback from '@/app/components/ui/Feedback';
import GameDetailsInfo from '@/app/components/game-details/GameDetailsInfo';
import { GuideStepsEditor } from '@/app/components/ui/GuideStepsEditor';
import { Trophy, TrophySidebar } from '@/app/components/ui/TrophySidebar';
import RichTextEditor from '@/app/components/ui/RichTextEditor';

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
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('PS5');
  const [difficultyRating, setDifficultyRating] = useState<number | ''>('');
  const [playthroughs, setPlaythroughs] = useState<number | ''>('');
  const [hours, setHours] = useState<number | ''>('');
  const [introHtml, setIntroHtml] = useState('');
  const [steps, setSteps] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const RAWG_API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY!;

  const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, '').trim();

  const guideContentRich = useMemo(
    () =>
      introHtml
        ? {
            type: 'doc',
            content: [{ type: 'paragraph', text: stripHtml(introHtml) }],
          }
        : null,
    [introHtml],
  );

  const stepRich = (text: string) =>
    text
      ? {
          type: 'doc',
          content: [{ type: 'paragraph', text }],
        }
      : null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setSubmitting(true);

    try {
      const payload = {
        title,
        platform,
        gameImage: null,
        trophies: {},
        difficulty: difficultyRating || null,
        hours: hours || null,
        playthroughs: playthroughs || null,
        content_rich: guideContentRich,
        content_html: introHtml || null,
        description: stripHtml(introHtml) || null,
        steps: steps.map((html, idx) => {
          const plain = stripHtml(html);
          return {
          title: `Βήμα ${idx + 1}`,
            description: plain,
            content_rich: stepRich(plain),
            content_html: html || null,
          };
        }),
      };

      const res = await fetch('/api/save-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Αποτυχία αποθήκευσης guide');
      }

      setAlert({ type: 'success', message: '✅ Το guide δημιουργήθηκε!' });
      setTitle('');
      setIntroHtml('');
      setSteps(['']);
    } catch (error) {
      console.error(error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Αποτυχία αποθήκευσης guide',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col-reverse gap-10 md:flex-row">
          {/* LEFT PANEL – MAIN CONTENT */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="bg-gradient-to-r from-blue-300 to-emerald-400 bg-clip-text text-3xl font-extrabold text-transparent md:text-4xl">
                Δημιουργία Trophy Guide
              </h1>
              {alert && (
                <Feedback
                  layout="toast"
                  tone={alert.type === 'success' ? 'solid' : 'soft'}
                  variant={alert.type}
                  title={alert.type === 'success' ? 'Επιτυχία' : 'Σφάλμα'}
                  description={alert.message}
                  dismissible
                  onDismiss={() => setAlert(null)}
                />
              )}
            </div>

            <form className="space-y-10" onSubmit={handleSubmit}>
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
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
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

                  <Select
                    label="Πλατφόρμα"
                    options={['PS3', 'PS4', 'PS5', 'PC', 'XBOX']}
                    value={platform}
                    onChange={val => setPlatform(val)}
                  />
                </CardContent>
              </Card>

              {/* PLATINUM STATS */}
              <Card className="border-slate-800 bg-slate-900/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-100">
                    🏆 Platinum Στατιστικά
                  </CardTitle>
                </CardHeader>

                <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <Input
                    label="Βαθμός Δυσκολίας (1-10)"
                    type="number"
                    min={1}
                    max={10}
                    value={difficultyRating}
                    onChange={e => setDifficultyRating(e.target.value ? Number(e.target.value) : '')}
                  />
                  <Input
                    label="Αριθμός Playthroughs"
                    type="number"
                    min={1}
                    max={10}
                    value={playthroughs}
                    onChange={e => setPlaythroughs(e.target.value ? Number(e.target.value) : '')}
                  />
                  <Input
                    label="Συνολικές Ώρες"
                    type="number"
                    value={hours}
                    onChange={e => setHours(e.target.value ? Number(e.target.value) : '')}
                  />
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
                  <RichTextEditor
                    label="Εισαγωγή"
                    placeholder="Ξεκινήστε με μια σύντομη περιγραφή..."
                    value={introHtml}
                    onChange={setIntroHtml}
                  />
                  <GuideStepsEditor value={steps} onChange={setSteps} />
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
                    <Button
                      variant="secondary"
                      type="button"
                      disabled={submitting}
                      className="border-slate-700 bg-slate-900/60 text-slate-200 transition hover:border-sky-500/70 hover:text-white"
                    >
                      💾 Αποθήκευση ως Draft
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={submitting}
                      className="bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-600 text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:shadow-emerald-400/40"
                    >
                      {submitting ? 'Αποθήκευση...' : '🚀 Υποβολή Guide'}
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
