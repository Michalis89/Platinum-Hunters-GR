'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { User, Mail, Calendar, MapPin, Trophy, Star, Clock, Edit, Gamepad2 } from 'lucide-react';
import { PageWrapper } from '@/app/components/layout/PageWrapper';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import {
  fetchSession,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
} from '@/store/slices/authSlice';
import { fetchBacklog, selectBacklogItems, selectStatusCounts } from '@/store/slices/backlogSlice';
import type { AppDispatch } from '@/store/store';

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectIsLoading);
  const userGames = useSelector(selectBacklogItems);
  const statusCounts = useSelector(selectStatusCounts);

  useEffect(() => {
    dispatch(fetchSession());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchBacklog());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/pages/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
            <p className="text-sm text-slate-400">Φόρτωση προφίλ...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!user) {
    return null; // redirect γίνεται από το useEffect
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Μη καθορισμένο';
    return new Date(dateString).toLocaleDateString('el-GR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const totalHours = Math.round(
    userGames.reduce(
      (sum, g) => sum + (g.actual_hours_casual || 0) + (g.actual_hours_platinum || 0),
      0,
    ),
  );

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          {/* HEADER CARD */}
          <Card className="border-slate-800 bg-slate-900/70 shadow-2xl backdrop-blur">
            <CardContent className="flex flex-col items-start justify-between gap-6 p-6 md:flex-row md:items-center">
              {/* Avatar + basic info */}
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-bold text-white shadow-lg md:h-24 md:w-24">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Platinum Hunters • Profile
                  </p>
                  <h1 className="mt-1 bg-gradient-to-r from-slate-50 to-blue-200 bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
                    {user.display_name || user.username}
                  </h1>
                  <p className="text-sm text-slate-400">@{user.username}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-blue-600 px-3 py-1 font-semibold uppercase text-white">
                      {user.role}
                    </span>
                    {user.email_verified && (
                      <span className="rounded-full bg-emerald-600 px-3 py-1 font-semibold text-white">
                        ✓ Επιβεβαιωμένο email
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit button */}
              <Button
                variant="primary"
                onClick={() => router.push('/pages/profile/edit')}
                className="flex items-center gap-2 self-stretch md:self-auto"
              >
                <Edit className="h-4 w-4" />
                Επεξεργασία Προφίλ
              </Button>
            </CardContent>
          </Card>

          {/* STATS GRID */}
          <Card className="border-slate-800 bg-slate-900/70 backdrop-blur">
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-6">
              {/* Πλατίνες */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-950/40 px-4 py-3">
                <div className="rounded-full bg-yellow-500/15 p-3">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-50">{statusCounts.platinumed || 0}</p>
                  <p className="text-xs text-slate-400">Πλατίνες</p>
                </div>
              </div>

              {/* Ολοκληρωμένα */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-950/40 px-4 py-3">
                <div className="rounded-full bg-purple-500/15 p-3">
                  <Star className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-50">{statusCounts.completed || 0}</p>
                  <p className="text-xs text-slate-400">Ολοκληρωμένα</p>
                </div>
              </div>

              {/* Παίζω τώρα */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-950/40 px-4 py-3">
                <div className="rounded-full bg-emerald-500/15 p-3">
                  <Gamepad2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-50">{statusCounts.playing || 0}</p>
                  <p className="text-xs text-slate-400">Παίζω τώρα</p>
                </div>
              </div>

              {/* Backlog */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-950/40 px-4 py-3">
                <div className="rounded-full bg-sky-500/15 p-3">
                  <Gamepad2 className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-50">{statusCounts.to_play || 0}</p>
                  <p className="text-xs text-slate-400">Backlog</p>
                </div>
              </div>

              {/* Dropped */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-950/40 px-4 py-3">
                <div className="rounded-full bg-red-500/15 p-3">
                  <Gamepad2 className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-50">{statusCounts.Dropped || 0}</p>
                  <p className="text-xs text-slate-400">Εγκαταλείφθηκαν</p>
                </div>
              </div>

              {/* Ώρες παιχνιδιού */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-950/40 px-4 py-3">
                <div className="rounded-full bg-blue-500/15 p-3">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-50">{totalHours}</p>
                  <p className="text-xs text-slate-400">Ώρες παιχνιδιού</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PERSONAL + GAMING INFO */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Personal Information */}
            <Card className="border-slate-800 bg-slate-900/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-slate-100">Προσωπικές Πληροφορίες</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-3 text-slate-200">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p>{user.email}</p>
                  </div>
                </div>

                {user.full_name && (
                  <div className="flex items-center gap-3 text-slate-200">
                    <User className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Ονοματεπώνυμο</p>
                      <p>{user.full_name}</p>
                    </div>
                  </div>
                )}

                {user.date_of_birth && (
                  <div className="flex items-center gap-3 text-slate-200">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Ημερομηνία Γέννησης</p>
                      <p>{formatDate(user.date_of_birth)}</p>
                    </div>
                  </div>
                )}

                {user.country && (
                  <div className="flex items-center gap-3 text-slate-200">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Χώρα</p>
                      <p>{user.country}</p>
                    </div>
                  </div>
                )}

                {user.bio && (
                  <div className="border-t border-slate-800 pt-4">
                    <p className="mb-1 text-xs text-slate-500">Βιογραφικό</p>
                    <p className="text-sm text-slate-200">{user.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gaming Information */}
            <Card className="border-slate-800 bg-slate-900/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-slate-100">Gaming Πληροφορίες</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {user.psn_id && (
                  <div>
                    <p className="text-xs text-slate-500">PSN ID</p>
                    <p className="text-slate-200">{user.psn_id}</p>
                  </div>
                )}

                {user.xbox_gamertag && (
                  <div>
                    <p className="text-xs text-slate-500">Xbox Gamertag</p>
                    <p className="text-slate-200">{user.xbox_gamertag}</p>
                  </div>
                )}

                {user.steam_id && (
                  <div>
                    <p className="text-xs text-slate-500">Steam ID</p>
                    <p className="text-slate-200">{user.steam_id}</p>
                  </div>
                )}

                {user.nintendo_id && (
                  <div>
                    <p className="text-xs text-slate-500">Nintendo ID</p>
                    <p className="text-slate-200">{user.nintendo_id}</p>
                  </div>
                )}

                {user.favorite_platform && (
                  <div className="border-t border-slate-800 pt-4">
                    <p className="text-xs text-slate-500">Αγαπημένη Πλατφόρμα</p>
                    <p className="text-slate-200">{user.favorite_platform}</p>
                  </div>
                )}

                {user.favorite_genres && user.favorite_genres.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs text-slate-500">Αγαπημένα Genres</p>
                    <div className="flex flex-wrap gap-2">
                      {user.favorite_genres.map(genre => (
                        <span
                          key={genre}
                          className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {user.gaming_since && (
                  <div>
                    <p className="text-xs text-slate-500">Gaming since</p>
                    <p className="text-slate-200">{user.gaming_since}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ACCOUNT INFO */}
          <Card className="border-slate-800 bg-slate-900/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-100">Πληροφορίες Λογαριασμού</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Μέλος από:</span>
                <span className="text-slate-200">{formatDate(user.created_at)}</span>
              </div>

              {user.last_login && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Τελευταία σύνδεση:</span>
                  <span className="text-slate-200">{formatDate(user.last_login)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Κατάσταση λογαριασμού:</span>
                <span className="capitalize text-emerald-400">
                  {user.account_status || 'active'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
