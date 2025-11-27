'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Trophy,
  Star,
  Clock,
  Edit,
  Gamepad2,
  ListChecks,
} from 'lucide-react';
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
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>
            <p className="text-gray-400">Φόρτωση προφίλ...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Μη καθορισμένο';
    return new Date(dateString).toLocaleDateString('el-GR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-3xl font-bold text-white">
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </div>

            {/* User Info */}
            <div>
              <h1 className="text-3xl font-bold text-white">
                {user.display_name || user.username}
              </h1>
              <p className="text-gray-400">@{user.username}</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase text-white">
                  {user.role}
                </span>
                {user.email_verified && (
                  <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                    ✓ Επιβεβαιωμένο
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <Button
            variant="primary"
            onClick={() => router.push('/pages/profile/edit')}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Επεξεργασία Προφίλ
          </Button>
        </div>

        {/* Stats Cards - Real Data from Games */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="rounded-full bg-yellow-500/20 p-3">
                <Trophy className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{statusCounts.platinumed || 0}</p>
                <p className="text-sm text-gray-400">Πλατίνες</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="rounded-full bg-purple-500/20 p-3">
                <Star className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{statusCounts.completed || 0}</p>
                <p className="text-sm text-gray-400">Ολοκληρωμένα</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="rounded-full bg-green-500/20 p-3">
                <Gamepad2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{statusCounts.playing || 0}</p>
                <p className="text-sm text-gray-400">Παίζω Τώρα</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="rounded-full bg-green-500/20 p-3">
                <Gamepad2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{statusCounts.to_play || 0}</p>
                <p className="text-sm text-gray-400">Backlog</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="rounded-full bg-green-500/20 p-3">
                <Gamepad2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{statusCounts.Dropped || 0}</p>
                <p className="text-sm text-gray-400">Εγκαταλείφθηκαν</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="rounded-full bg-blue-500/20 p-3">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {Math.round(
                    userGames.reduce(
                      (sum, g) =>
                        sum + (g.actual_hours_casual || 0) + (g.actual_hours_platinum || 0),
                      0,
                    ),
                  )}
                </p>
                <p className="text-sm text-gray-400">Ώρες Παιχνιδιού</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Προσωπικές Πληροφορίες</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{user.email}</p>
                </div>
              </div>

              {user.full_name && (
                <div className="flex items-center gap-3 text-gray-300">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Ονοματεπώνυμο</p>
                    <p>{user.full_name}</p>
                  </div>
                </div>
              )}

              {user.date_of_birth && (
                <div className="flex items-center gap-3 text-gray-300">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Ημερομηνία Γέννησης</p>
                    <p>{formatDate(user.date_of_birth)}</p>
                  </div>
                </div>
              )}

              {user.country && (
                <div className="flex items-center gap-3 text-gray-300">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Χώρα</p>
                    <p>{user.country}</p>
                  </div>
                </div>
              )}

              {user.bio && (
                <div className="border-t border-gray-700 pt-4">
                  <p className="mb-2 text-sm text-gray-500">Βιογραφικό</p>
                  <p className="text-gray-300">{user.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gaming Information */}
          <Card>
            <CardHeader>
              <CardTitle>Gaming Πληροφορίες</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.psn_id && (
                <div>
                  <p className="text-sm text-gray-500">PSN ID</p>
                  <p className="text-gray-300">{user.psn_id}</p>
                </div>
              )}

              {user.xbox_gamertag && (
                <div>
                  <p className="text-sm text-gray-500">Xbox Gamertag</p>
                  <p className="text-gray-300">{user.xbox_gamertag}</p>
                </div>
              )}

              {user.steam_id && (
                <div>
                  <p className="text-sm text-gray-500">Steam ID</p>
                  <p className="text-gray-300">{user.steam_id}</p>
                </div>
              )}

              {user.nintendo_id && (
                <div>
                  <p className="text-sm text-gray-500">Nintendo ID</p>
                  <p className="text-gray-300">{user.nintendo_id}</p>
                </div>
              )}

              {user.favorite_platform && (
                <div className="border-t border-gray-700 pt-4">
                  <p className="text-sm text-gray-500">Αγαπημένη Πλατφόρμα</p>
                  <p className="text-gray-300">{user.favorite_platform}</p>
                </div>
              )}

              {user.favorite_genres && user.favorite_genres.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-gray-500">Αγαπημένα Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {user.favorite_genres.map(genre => (
                      <span
                        key={genre}
                        className="rounded-full bg-gray-700 px-3 py-1 text-xs text-gray-300"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {user.gaming_since && (
                <div>
                  <p className="text-sm text-gray-500">Gaming Since</p>
                  <p className="text-gray-300">{user.gaming_since}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Πληροφορίες Λογαριασμού</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Μέλος από:</span>
              <span className="text-gray-300">{formatDate(user.created_at)}</span>
            </div>
            {user.last_login && (
              <div className="flex justify-between">
                <span className="text-gray-500">Τελευταία σύνδεση:</span>
                <span className="text-gray-300">{formatDate(user.last_login)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Κατάσταση λογαριασμού:</span>
              <span className="capitalize text-green-500">{user.account_status || 'active'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
