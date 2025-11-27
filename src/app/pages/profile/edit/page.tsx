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
import { fetchSession, selectUser, selectIsAuthenticated, selectIsLoading, updateUserProfile, logout } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';
import type { User } from '@/types/user';
import { supabase } from '@/lib/supabase-client';

const COUNTRIES = ['GR', 'US', 'UK', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'Other'];
const PLATFORMS = ['PS5', 'PS4', 'PS3', 'Xbox Series X/S', 'Xbox One', 'Nintendo Switch', 'PC'];
const GENRES = ['Action', 'RPG', 'Adventure', 'Shooter', 'Sports', 'Racing', 'Fighting', 'Puzzle', 'Horror', 'Platform'];

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
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500 mx-auto"></div>
            <p className="text-gray-400">Φόρτωση...</p>
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

  const handleSelectChange = (name: string) => (value: string) => {
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
      await dispatch(updateUserProfile({
        userId: user.id,
        updates: formData,
      })).unwrap();

      setAlert({ type: 'success', message: '✅ Το προφίλ ενημερώθηκε επιτυχώς!' });

      // Redirect after short delay
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

  const handleSaveClick = () => {
    const form = document.querySelector('form');
    if (form) {
      form.requestSubmit();
    }
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

      // Clear ALL client-side state
      try {
        // Clear Supabase session
        await supabase.auth.signOut();
      } catch (e) {
        console.log('SignOut error (ignored):', e);
      }

      // Clear Redux state
      await dispatch(logout());

      // Clear localStorage and sessionStorage completely
      localStorage.clear();
      sessionStorage.clear();

      // Force page reload to clear everything
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Επεξεργασία Προφίλ</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4" />
              Ακύρωση
            </Button>
            <Button variant="primary" onClick={handleSaveClick} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </Button>
          </div>
        </div>

        {alert && <AlertMessage type={alert.type} message={alert.message} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Προσωπικές Πληροφορίες</CardTitle>
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

              <Textarea
                label="Bio"
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                placeholder="Πες μας λίγα λόγια για σένα..."
                rows={4}
              />
              <div className="text-xs text-gray-400">
                {(formData.bio?.length || 0)} / 500 χαρακτήρες
              </div>
            </CardContent>
          </Card>

          {/* Gaming Information */}
          <Card>
            <CardHeader>
              <CardTitle>Gaming Πληροφορίες</CardTitle>
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
                <label className="block text-sm font-medium text-white mb-2">
                  Αγαπημένα Genres
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {GENRES.map(genre => (
                    <label
                      key={genre}
                      className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-800 transition"
                    >
                      <input
                        type="checkbox"
                        checked={formData.favorite_genres?.includes(genre) || false}
                        onChange={() => handleGenreToggle(genre)}
                        className="rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">{genre}</span>
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

          {/* Save Buttons (Bottom) */}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4" />
              Ακύρωση
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Αποθήκευση...' : 'Αποθήκευση Αλλαγών'}
            </Button>
          </div>
        </form>

        {/* Danger Zone */}
        <Card className="border-2 border-red-900/50 bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-300 mb-2">
                Η διαγραφή του λογαριασμού σου είναι <strong>μόνιμη</strong> και δεν μπορεί να αναιρεθεί.
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Θα διαγραφούν:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 mb-4">
                <li>Όλα τα προσωπικά σου δεδομένα</li>
                <li>Το προφίλ σου</li>
                <li>Οι οδηγοί που έχεις γράψει (αν υπάρχουν)</li>
                <li>Τα σχόλιά σου</li>
                <li>Το ιστορικό δραστηριότητας σου</li>
              </ul>

              {!showDeleteConfirm ? (
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="border-red-700 text-red-400 hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                  Διαγραφή Λογαριασμού
                </Button>
              ) : (
                <div className="space-y-4 p-4 border-2 border-red-700 rounded-lg bg-red-950/30">
                  <p className="text-sm text-red-300 font-semibold">
                    ⚠️ Είσαι σίγουρος; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί!
                  </p>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Πληκτρολόγησε <code className="px-2 py-1 bg-gray-800 rounded">ΔΙΑΓΡΑΦΗ</code> για να επιβεβαιώσεις:
                    </label>
                    <Input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="ΔΙΑΓΡΑΦΗ"
                      className="border-red-700"
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
                      className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleting ? 'Διαγραφή...' : 'Οριστική Διαγραφή'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
