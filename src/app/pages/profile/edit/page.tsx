'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { Save, X, Trash2, AlertTriangle } from 'lucide-react';
import { PageWrapper } from '@/app/components/layout/PageWrapper';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Textarea } from '@/app/components/ui/Textarea';
import { Button } from '@/app/components/ui/Button';
import AlertMessage from '@/app/components/ui/AlertMessage';
import {
  fetchSession,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  updateUserProfile,
  logout,
} from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';
import type { User } from '@/types/user';
import { supabase } from '@/lib/supabase-client';

const COUNTRIES = ['GR', 'US', 'UK', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'Other'];
const PLATFORMS = ['PS5', 'PS4', 'PS3', 'Xbox Series X/S', 'Xbox One', 'Nintendo Switch', 'PC'];
const GENRES = [
  'Action',
  'RPG',
  'Adventure',
  'Shooter',
  'Sports',
  'Racing',
  'Fighting',
  'Puzzle',
  'Horror',
  'Platform',
];

export default function EditProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectIsLoading);

  const [formData, setFormData] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchSession());
  }, [dispatch]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/pages/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        date_of_birth: user.date_of_birth || '',
        country: user.country || 'GR',
        bio: user.bio || '',
        psn_id: user.psn_id || '',
        xbox_gamertag: user.xbox_gamertag || '',
        steam_id: user.steam_id || '',
        nintendo_id: user.nintendo_id || '',
        favorite_platform: user.favorite_platform || '',
        favorite_genres: user.favorite_genres || [],
        gaming_since: user.gaming_since || null,
      });
    }
  }, [user]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
            <p className="text-sm text-slate-400">Φόρτωση...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!user) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange =
    (name: string) =>
    (value: string): void => {
      setFormData(prev => ({ ...prev, [name]: value }));
    };

  const handleGenreToggle = (genre: string) => {
    setFormData(prev => {
      const genres = prev.favorite_genres || [];
      const newGenres = genres.includes(genre)
        ? genres.filter(g => g !== genre)
        : [...genres, genre];
      return { ...prev, favorite_genres: newGenres };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setSaving(true);

    try {
      await dispatch(
        updateUserProfile({
          userId: user.id,
          updates: formData,
        }),
      ).unwrap();

      setAlert({ type: 'success', message: '✅ Το προφίλ ενημερώθηκε επιτυχώς!' });

      setTimeout(() => {
        router.push('/pages/profile');
      }, 1500);
    } catch (error) {
      console.error('Update error:', error);
      setAlert({
        type: 'error',
        message: '❌ Σφάλμα ενημέρωσης προφίλ. Δοκιμάστε ξανά.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/pages/profile');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ΔΙΑΓΡΑΦΗ') {
      setAlert({
        type: 'error',
        message: '❌ Πληκτρολόγησε "ΔΙΑΓΡΑΦΗ" για να επιβεβαιώσεις',
      });
      return;
    }

    setDeleting(true);
    setAlert(null);

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Σφάλμα διαγραφής λογαριασμού');
      }

      setAlert({
        type: 'success',
        message: '✅ Ο λογαριασμός διαγράφηκε. Ανακατεύθυνση...',
      });

      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.log('SignOut error (ignored):', e);
      }

      await dispatch(logout());

      localStorage.clear();
      sessionStorage.clear();

      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error) {
      console.error('Delete account error:', error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : '❌ Σφάλμα διαγραφής λογαριασμού',
      });
      setDeleting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-10">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          {/* Top bar */}
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Account • Profile Settings
              </p>
              <h1 className="mt-1 bg-gradient-to-r from-slate-50 to-blue-200 bg-clip-text text-3xl font-extrabold text-transparent">
                Επεξεργασία Προφίλ
              </h1>
            </div>
          </div>

          {alert && <AlertMessage type={alert.type} message={alert.message} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <Card className="border-slate-800 bg-slate-900/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-slate-100">Προσωπικές Πληροφορίες</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Ονοματεπώνυμο"
                  type="text"
                  name="full_name"
                  value={formData.full_name || ''}
                  onChange={handleChange}
                  placeholder="Γιάννης Παπαδόπουλος"
                />

                <Input
                  label="Ημερομηνία Γέννησης"
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth || ''}
                  onChange={handleChange}
                />

                <Select
                  label="Χώρα"
                  options={COUNTRIES}
                  value={formData.country || ''}
                  onChange={handleSelectChange('country')}
                />

                <div>
                  <Textarea
                    label="Bio"
                    name="bio"
                    value={formData.bio || ''}
                    onChange={handleChange}
                    placeholder="Πες μας λίγα λόγια για σένα..."
                    rows={4}
                  />
                  <div className="mt-1 text-xs text-slate-500">
                    {formData.bio?.length || 0} / 500 χαρακτήρες
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gaming Information */}
            <Card className="border-slate-800 bg-slate-900/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-slate-100">Gaming Πληροφορίες</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="PSN ID"
                    type="text"
                    name="psn_id"
                    value={formData.psn_id || ''}
                    onChange={handleChange}
                    placeholder="YourPSNID"
                  />

                  <Input
                    label="Xbox Gamertag"
                    type="text"
                    name="xbox_gamertag"
                    value={formData.xbox_gamertag || ''}
                    onChange={handleChange}
                    placeholder="YourGamertag"
                  />

                  <Input
                    label="Steam ID"
                    type="text"
                    name="steam_id"
                    value={formData.steam_id || ''}
                    onChange={handleChange}
                    placeholder="YourSteamID"
                  />

                  <Input
                    label="Nintendo ID"
                    type="text"
                    name="nintendo_id"
                    value={formData.nintendo_id || ''}
                    onChange={handleChange}
                    placeholder="YourNintendoID"
                  />
                </div>

                <Select
                  label="Αγαπημένη Πλατφόρμα"
                  options={['', ...PLATFORMS]}
                  value={formData.favorite_platform || ''}
                  onChange={handleSelectChange('favorite_platform')}
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-100">
                    Αγαπημένα Genres
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                    {GENRES.map(genre => (
                      <label
                        key={genre}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-2 py-1.5 text-sm text-slate-200 transition hover:bg-slate-900"
                      >
                        <input
                          type="checkbox"
                          checked={formData.favorite_genres?.includes(genre) || false}
                          onChange={() => handleGenreToggle(genre)}
                          className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                        <span>{genre}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Input
                  label="Gaming Since (Έτος)"
                  type="number"
                  name="gaming_since"
                  value={formData.gaming_since || ''}
                  onChange={handleChange}
                  placeholder="2005"
                  min="1970"
                  max={new Date().getFullYear()}
                />
              </CardContent>
            </Card>

            {/* Bottom Save Buttons */}
            <div className="mt-4 flex justify-end gap-3">
              {/* Primary Button */}
              <Button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-white to-slate-200 px-6 py-2.5 font-semibold text-slate-900 shadow-[0_4px_12px_rgba(255,255,255,0.15),0_0_12px_rgba(59,130,246,0.3)] transition-all duration-300 hover:from-white hover:to-slate-100 hover:shadow-[0_6px_16px_rgba(255,255,255,0.25),0_0_18px_rgba(59,130,246,0.45)] active:scale-[0.97]"
              >
                <Save className="h-4 w-4 text-slate-800" />
                <span className="text-slate-800">{saving ? 'Αποθήκευση...' : 'Αποθήκευση'}</span>
              </Button>
              {/* Secondary Button */}
              <Button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-900/40 px-6 py-2.5 font-medium text-slate-200 shadow-[inset_0_0_8px_rgba(255,255,255,0.05)] backdrop-blur-lg transition-all duration-300 hover:border-slate-500 hover:bg-slate-800/40 active:scale-[0.97]"
              >
                <X className="h-4 w-4 text-slate-300" />
                Ακύρωση
              </Button>
            </div>
          </form>

          {/* Danger Zone */}
          <Card className="border-2 border-red-900/60 bg-red-950/25 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-300">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-slate-200">
                Η διαγραφή του λογαριασμού σου είναι <strong>μόνιμη</strong> και δεν μπορεί να
                αναιρεθεί.
              </p>
              <p className="text-slate-400">Θα διαγραφούν:</p>
              <ul className="mb-4 ml-4 list-disc space-y-1 text-slate-400">
                <li>Όλα τα προσωπικά σου δεδομένα</li>
                <li>Το προφίλ σου</li>
                <li>Οι οδηγοί που έχεις γράψει (αν υπάρχουν)</li>
                <li>Τα σχόλιά σου</li>
                <li>Το ιστορικό δραστηριότητάς σου</li>
              </ul>

              {!showDeleteConfirm ? (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 rounded-xl border border-red-600/60 bg-red-900/20 px-5 py-2.5 font-semibold text-red-300 shadow-[inset_0_0_12px_rgba(255,0,0,0.15)] backdrop-blur-lg transition-all duration-300 hover:border-red-500 hover:bg-red-900/30 hover:text-red-200 hover:shadow-[inset_0_0_14px_rgba(255,0,0,0.25),0_0_12px_rgba(255,0,0,0.25)] active:scale-[0.97]"
                >
                  <Trash2 className="h-4 w-4" />
                  Διαγραφή Λογαριασμού
                </Button>
              ) : (
                <div className="space-y-4 rounded-lg border border-red-800 bg-red-950/40 p-4">
                  <p className="font-semibold text-red-200">
                    ⚠️ Είσαι σίγουρος; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί!
                  </p>
                  <div>
                    <label className="mb-2 block text-xs text-slate-200">
                      Πληκτρολόγησε{' '}
                      <code className="rounded bg-slate-900 px-2 py-1 text-red-300">ΔΙΑΓΡΑΦΗ</code>{' '}
                      για να επιβεβαιώσεις:
                    </label>
                    <Input
                      type="text"
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder="ΔΙΑΓΡΑΦΗ"
                      disabled={deleting}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      disabled={deleting}
                    >
                      Ακύρωση
                    </Button>
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteConfirmText !== 'ΔΙΑΓΡΑΦΗ'}
                      className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleting ? 'Διαγραφή...' : 'Οριστική Διαγραφή'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
