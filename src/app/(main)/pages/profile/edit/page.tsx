'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
  Save,
  X,
  Trash2,
  AlertTriangle,
  Camera,
  Globe2,
  Instagram,
  Link2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Twitch,
  Twitter,
  Youtube,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Textarea } from '@/app/components/ui/Textarea';
import Skeleton from '@/app/components/ui/Skeleton';
import AlertMessage from '@/app/components/ui/AlertMessage';
import {
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  updateUserProfile,
  logout,
} from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';
import type { User } from '@/types/user';
import { supabase } from '@/lib/supabase-client';
import Button from '@/app/components/ui/Button';

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
const CATEGORIES = [
  'games',
  'anime',
  'manga',
  'books',
  'movies',
  'tv',
  'coding',
  'pet',
  'vape',
] as const;
const CATEGORY_SERVICES: Record<string, string[]> = {
  anime: ['Anilist', 'MyAnimeList', 'Crunchyroll', 'Netflix', 'Other'],
  manga: ['Anilist', 'MyAnimeList', 'MangaPlus', 'Comixology', 'Other'],
  books: ['Goodreads', 'StoryGraph', 'Kindle', 'Audible', 'Other'],
  movies: [
    'Netflix',
    'HBO / Max',
    'Disney+',
    'Amazon Prime',
    'Apple TV+',
    'Hulu',
    'Cinema',
    'Blu-ray / Physical',
    'Other',
  ],
  tv: ['Netflix', 'HBO / Max', 'Disney+', 'Amazon Prime', 'Apple TV+', 'Hulu', 'Other'],
};
const TV_GENRES = [
  'Action',
  'Drama',
  'Comedy',
  'Sci-Fi',
  'Fantasy',
  'Thriller',
  'Crime',
  'Mystery',
  'Horror',
  'Romance',
  'Documentary',
  'Animated',
  'Sitcom',
  'Superhero',
];
const TV_STYLES = ['Binge watching', '1–2 episodes per day', 'Weekly releases', 'Depends'];
const MOVIE_GENRES = [
  'Action',
  'Adventure',
  'Sci-Fi',
  'Fantasy',
  'Comedy',
  'Drama',
  'Thriller',
  'Crime',
  'Mystery',
  'Horror',
  'Romance',
  'Documentary',
  'Animation',
  'Superhero',
  'War',
  'Western',
  'Musical',
  'Biography',
  'Historical',
];
const MOVIE_STYLES = [
  'Cinema first',
  'Streaming only',
  'Depends on the movie',
  'Watch occasionally',
  'Movie marathon sessions',
];
const CODING_LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'C#',
  'C++',
  'Java',
  'Go',
  'Rust',
  'PHP',
  'Ruby',
  'Other',
];
const CODING_FOCUS = [
  'Web',
  'Mobile',
  'Backend',
  'Game Dev',
  'Data',
  'DevOps',
  'Embedded',
  'Other',
];
const PET_TYPES = ['Σκύλος', 'Γάτα', 'Πτηνά', 'Ψάρια', 'Ερπετά', 'Άλλα'];
const VAPE_DEVICES = ['Pod', 'Mod', 'Disposable', 'MTL', 'DTL', 'Άλλα'];
const VAPE_FLAVORS = ['Tobacco', 'Dessert', 'Fruits', 'Menthol', 'Drinks', 'Άλλα'];
const BOOK_GENRES = [
  'Fantasy',
  'Sci-Fi',
  'Mystery',
  'Thriller',
  'Horror',
  'Romance',
  'Historical Fiction',
  'Drama / Literary Fiction',
  'Adventure',
  'Crime',
  'Philosophy',
  'Psychology',
  'Biography',
  'Self-help',
  'Poetry',
  'Comics / Graphic Novels',
  'Young Adult',
  'Children’s Literature',
];
const BOOK_FORMATS = ['Physical books', 'eBooks', 'Audiobooks', 'Mixed', 'Depends on the book'];
const MANGA_GENRES = [
  'Shōnen',
  'Seinen',
  'Shōjo',
  'Josei',
  'Isekai',
  'Fantasy',
  'Adventure',
  'Action',
  'Sci-Fi',
  'Romance',
  'Drama',
  'Horror',
  'Mystery',
  'Thriller',
  'Slice of Life',
  'Comedy',
  'Supernatural',
  'Historical',
  'Sports',
  'Mecha',
];
const MANGA_FORMATS = [
  'Physical volumes / tankobon',
  'Digital manga',
  'Webtoons',
  'Scanlations',
  'Mixed',
];
const ANIME_GENRES = [
  'Shōnen',
  'Seinen',
  'Shōjo',
  'Josei',
  'Isekai',
  'Fantasy',
  'Sci-Fi',
  'Mecha',
  'Action',
  'Adventure',
  'Romance',
  'Drama',
  'Mystery',
  'Horror',
  'Thriller',
  'Comedy',
  'Slice of Life',
  'Supernatural',
  'Psychological',
  'Sports',
  'Historical',
  'Music',
];
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

const SOCIAL_PLATFORMS = [
  {
    key: 'discord',
    label: 'Discord',
    icon: MessageCircle,
    placeholder: 'username#1234 ή invite link',
  },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@handle ή url' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'channel / video url' },
  { key: 'twitch', label: 'Twitch', icon: Twitch, placeholder: 'twitch.tv/...' },
  { key: 'twitter', label: 'X / Twitter', icon: Twitter, placeholder: '@handle ή url' },
  { key: 'reddit', label: 'Reddit', icon: Link2, placeholder: 'reddit.com/u/...' },
  { key: 'website', label: 'Portfolio / Website', icon: Globe2, placeholder: 'https://...' },
];

const TIMEZONES = [
  'Europe/Athens',
  'Europe/London',
  'Europe/Berlin',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
];

type CategoryNotes = Record<string, unknown>;
type ProfileFormData = Partial<User> & {
  categories?: string[];
  category_notes?: CategoryNotes;
};
const EMPTY_CATEGORY_NOTES = {} as CategoryNotes;

export default function EditProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectIsLoading);

  const [formData, setFormData] = useState<ProfileFormData>({});
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [locationCity, setLocationCity] = useState('');
  const [privacySettings, setPrivacySettings] = useState({
    show_age: false,
    show_social_links: true,
    show_location: true,
  });
  const [initialSnapshot, setInitialSnapshot] = useState<string>('');
  const [snapshotUserId, setSnapshotUserId] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const initialCategoryNotes = useMemo<CategoryNotes>(() => {
    const notes = (user?.social_links as Record<string, unknown> | null | undefined)
      ?.category_notes;
    return (notes as CategoryNotes) || EMPTY_CATEGORY_NOTES;
  }, [user?.social_links]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/pages/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  // Handle hash scroll after page load (for links like #categories)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Small delay to ensure the element is rendered
      const timer = setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        date_of_birth: user.date_of_birth || '',
        country: user.country || 'GR',
        timezone: user.timezone || '',
        display_name: user.display_name || '',
        avatar_url: user.avatar_url || '',
        bio: user.bio || '',
        psn_id: user.psn_id || '',
        xbox_gamertag: user.xbox_gamertag || '',
        steam_id: user.steam_id || '',
        nintendo_id: user.nintendo_id || '',
        favorite_platform: user.favorite_platform || '',
        favorite_genres: user.favorite_genres || [],
        gaming_since: user.gaming_since || null,
        categories: (user.categories as string[] | undefined) ?? ['games'],
        category_notes: initialCategoryNotes,
      });

      const rawSocial = (user.social_links as Record<string, unknown> | undefined) || {};
      setSocialLinks({
        discord: (rawSocial.discord as string) || '',
        instagram: (rawSocial.instagram as string) || '',
        youtube: (rawSocial.youtube as string) || '',
        twitch: (rawSocial.twitch as string) || '',
        twitter: (rawSocial.twitter as string) || '',
        reddit: (rawSocial.reddit as string) || '',
        website: (rawSocial.website as string) || (rawSocial.portfolio as string) || '',
      });
      setLocationCity((rawSocial.location_city as string) || '');

      const rawPrivacy = (user.privacy_settings as unknown as Record<string, unknown>) || {};
      setPrivacySettings({
        show_age: (rawPrivacy.show_age as boolean | undefined) ?? false,
        show_social_links: (rawPrivacy.show_social_links as boolean | undefined) ?? true,
        show_location: (rawPrivacy.show_location as boolean | undefined) ?? true,
      });
      setAvatarPreview(null);
      const snap = makeSnapshot(
        {
          full_name: user.full_name || '',
          date_of_birth: user.date_of_birth || '',
          country: user.country || 'GR',
          timezone: user.timezone || '',
          display_name: user.display_name || '',
          avatar_url: user.avatar_url || '',
          bio: user.bio || '',
          psn_id: user.psn_id || '',
          xbox_gamertag: user.xbox_gamertag || '',
          steam_id: user.steam_id || '',
          nintendo_id: user.nintendo_id || '',
          favorite_platform: user.favorite_platform || '',
          favorite_genres: user.favorite_genres || [],
          gaming_since: user.gaming_since || null,
          categories: (user.categories as string[] | undefined) ?? ['games'],
          category_notes: initialCategoryNotes,
        },
        {
          discord: (rawSocial.discord as string) || '',
          instagram: (rawSocial.instagram as string) || '',
          youtube: (rawSocial.youtube as string) || '',
          twitch: (rawSocial.twitch as string) || '',
          twitter: (rawSocial.twitter as string) || '',
          reddit: (rawSocial.reddit as string) || '',
          website: (rawSocial.website as string) || (rawSocial.portfolio as string) || '',
        },
        (rawSocial.location_city as string) || '',
        {
          show_age: (rawPrivacy.show_age as boolean | undefined) ?? false,
          show_social_links: (rawPrivacy.show_social_links as boolean | undefined) ?? true,
          show_location: (rawPrivacy.show_location as boolean | undefined) ?? true,
        },
        (user.avatar_url as string) || '',
      );
      setInitialSnapshot(snap);
      setSnapshotUserId(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initialCategoryNotes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--hb-bg)]">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <Skeleton type="profile-edit" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentAvatar =
    avatarPreview || (formData.avatar_url as string) || (user.avatar_url as string | null) || '';
  const currentSnapshot = makeSnapshot(
    formData,
    socialLinks,
    locationCity,
    privacySettings,
    avatarFile
      ? 'pending-upload'
      : (formData.avatar_url as string) || (user.avatar_url as string) || '',
  );
  const isDirty =
    !!avatarFile ||
    (!!initialSnapshot && currentSnapshot !== initialSnapshot && snapshotUserId === user.id);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange =
    (name: string) =>
    (value: string): void => {
      setFormData(prev => ({ ...prev, [name]: value }));
    };

  const handleSocialLinkChange = (key: string, value: string) => {
    setSocialLinks(prev => ({ ...prev, [key]: value }));
  };

  const togglePrivacySetting = (key: keyof typeof privacySettings) => {
    setPrivacySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = () => {
    setAvatarPreview(null);
    setFormData(prev => ({ ...prev, avatar_url: '' }));
    setAvatarFile(null);
  };

  function normalizeArray(val: unknown) {
    return Array.isArray(val) ? [...val].map(String).sort() : val;
  }

  function makeSnapshot(
    data: ProfileFormData,
    socials: Record<string, string>,
    locCity: string,
    privacy: typeof privacySettings,
    avatarMarker: string,
  ) {
    const { favorite_genres, categories, category_notes, ...rest } = data;
    return JSON.stringify({
      form: {
        ...rest,
        favorite_genres: normalizeArray(favorite_genres),
        categories: normalizeArray(categories),
        category_notes: category_notes || EMPTY_CATEGORY_NOTES,
      },
      socials,
      locCity,
      privacy,
      avatar: avatarMarker,
    });
  }

  const handleGenreToggle = (genre: string) => {
    setFormData(prev => {
      const genres = prev.favorite_genres || [];
      const newGenres = genres.includes(genre)
        ? genres.filter(g => g !== genre)
        : [...genres, genre];
      return { ...prev, favorite_genres: newGenres };
    });
  };

  const toggleCategory = (cat: string) => {
    setFormData(prev => {
      const current = (prev.categories as string[] | undefined) ?? [];
      const next = current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat];
      return { ...prev, categories: next };
    });
  };

  const getCategoryNote = (cat: string) => {
    const notes = (formData.category_notes as Record<string, unknown> | undefined) || {};
    return (notes[cat] as Record<string, unknown> | undefined) || {};
  };

  const handleCategoryNoteField =
    (cat: string, key: string) => (value: string | number | string[]) => {
      setFormData(prev => {
        const notes = (prev.category_notes as Record<string, unknown> | undefined) || {};
        const current = (notes[cat] as Record<string, unknown> | undefined) || {};
        return {
          ...prev,
          category_notes: {
            ...notes,
            [cat]: { ...current, [key]: value },
          },
        };
      });
    };

  const handleCategoryGenreToggle = (cat: string, genre: string) => {
    setFormData(prev => {
      const notes = (prev.category_notes as Record<string, unknown> | undefined) || {};
      const current = (notes[cat] as Record<string, unknown> | undefined) || {};
      const list: string[] = Array.isArray((current as { genres?: unknown }).genres)
        ? ((current as { genres?: string[] }).genres as string[])
        : [];
      const nextGenres = list.includes(genre) ? list.filter(g => g !== genre) : [...list, genre];
      return {
        ...prev,
        category_notes: {
          ...notes,
          [cat]: { ...current, genres: nextGenres },
        },
      };
    });
  };

  const handleCategoryListToggle = (cat: string, key: string, item: string) => {
    setFormData(prev => {
      const notes = (prev.category_notes as Record<string, unknown> | undefined) || {};
      const current = (notes[cat] as Record<string, unknown> | undefined) || {};
      const list: string[] = Array.isArray((current as { [k: string]: unknown })[key])
        ? ((current as { [k: string]: string[] })[key] as string[])
        : [];
      const next = list.includes(item) ? list.filter(v => v !== item) : [...list, item];
      return {
        ...prev,
        category_notes: {
          ...notes,
          [cat]: { ...current, [key]: next },
        },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setSaving(true);

    try {
      let uploadedAvatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'png';
        const path = `${user.id}/avatar-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true, cacheControl: '3600' });
        if (uploadError) {
          throw uploadError;
        }
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        uploadedAvatarUrl = data.publicUrl || null;
      }

      const { category_notes, ...rest } = formData;
      const mergedPrivacy = {
        ...(user.privacy_settings as unknown as Record<string, unknown>),
        ...privacySettings,
      };
      const mergedSocialLinks = {
        ...(user.social_links as Record<string, unknown> | undefined),
        ...socialLinks,
        location_city: locationCity,
        category_notes: category_notes || EMPTY_CATEGORY_NOTES,
      } as User['social_links'];

      // Convert empty strings to null for unique constraint fields
      const emptyToNull = (val: string | null | undefined): string | null =>
        val && val.trim() !== '' ? val.trim() : null;

      const sanitizedRest = {
        ...rest,
        psn_id: emptyToNull(rest.psn_id),
        xbox_gamertag: emptyToNull(rest.xbox_gamertag),
        steam_id: emptyToNull(rest.steam_id),
        nintendo_id: emptyToNull(rest.nintendo_id),
      };

      await dispatch(
        updateUserProfile({
          userId: user.id,
          updates: {
            ...sanitizedRest,
            avatar_url: uploadedAvatarUrl || rest.avatar_url || user.avatar_url || null,
            privacy_settings: mergedPrivacy as User['privacy_settings'],
            social_links: mergedSocialLinks,
          },
        }),
      ).unwrap();

      setAlert({ type: 'success', message: '✅ Το προφίλ ενημερώθηκε επιτυχώς!' });

      // Reset snapshot after successful save
      const newSnapshot = makeSnapshot(
        {
          ...formData,
          avatar_url: uploadedAvatarUrl || rest.avatar_url || user.avatar_url || null,
        },
        socialLinks,
        locationCity,
        privacySettings,
        uploadedAvatarUrl || (rest.avatar_url as string) || (user.avatar_url as string) || '',
      );
      setInitialSnapshot(newSnapshot);
      setSnapshotUserId(user.id);

      setTimeout(() => {
        router.push('/pages/profile');
      }, 1500);
    } catch (error) {
      console.error('Update error:', error);

      // Handle specific database constraint errors
      let errorMessage = '❌ Σφάλμα ενημέρωσης προφίλ. Δοκιμάστε ξανά.';
      const errorStr = String(error);

      if (errorStr.includes('23505') || errorStr.includes('unique constraint')) {
        if (errorStr.includes('psn_id')) {
          errorMessage = '❌ Αυτό το PSN ID χρησιμοποιείται ήδη από άλλον χρήστη.';
        } else if (errorStr.includes('username')) {
          errorMessage = '❌ Αυτό το username χρησιμοποιείται ήδη.';
        } else if (errorStr.includes('email')) {
          errorMessage = '❌ Αυτό το email χρησιμοποιείται ήδη.';
        } else {
          errorMessage = '❌ Αυτή η τιμή χρησιμοποιείται ήδη από άλλον χρήστη.';
        }
      }

      setAlert({
        type: 'error',
        message: errorMessage,
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
      const payload = data.data ?? data;
      void payload;

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
    <div className="relative min-h-screen bg-[var(--hb-bg)] text-[var(--hb-text)]">
      {/* Background gradient (like About/Profile page) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
        <div className="absolute inset-0 bg-[var(--hb-gradient)] blur-[100px]" />
      </div>

      <div className="relative px-4 py-10 md:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          {/* Hero-style Header */}
          <section className="mb-4 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[var(--hb-primary-strong)]">
              Account • Profile Settings
            </p>
            <h1 className="mb-2 text-3xl font-extrabold leading-tight md:text-4xl">
              <span className="bg-gradient-to-r from-[var(--hb-headline)] via-[var(--hb-text)] to-[var(--hb-muted)] bg-clip-text text-transparent">
                Επεξεργασία Προφίλ
              </span>
            </h1>
            <p className="mx-auto max-w-xl text-sm text-[var(--hb-muted)]">
              Διαχειρίσου τις πληροφορίες, τα hobbies και τις ρυθμίσεις απορρήτου του λογαριασμού
              σου.
            </p>
          </section>

          {alert && <AlertMessage type={alert.type} message={alert.message} />}

          <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <Card className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur">
              <CardHeader className="bg-[var(--hb-card)]/50 border-b border-[var(--hb-border)]">
                <p className="mb-1 text-xs uppercase tracking-[0.25em] text-[var(--hb-primary-strong)]">
                  Βασικά Στοιχεία
                </p>
                <CardTitle className="text-lg text-[var(--hb-headline)]">
                  Προσωπικές Πληροφορίες
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--hb-headline)]">
                    <ShieldCheck className="h-4 w-4 text-[var(--hb-primary)]" />
                    <span>Πληροφορίες Λογαριασμού</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Username" value={user.username} disabled />
                    <Input
                      label="Display Name"
                      type="text"
                      name="display_name"
                      value={formData.display_name || ''}
                      onChange={handleChange}
                      placeholder="Το όνομα που θα βλέπουν όλοι"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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
                </div>

                <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--hb-headline)]">
                    <MapPin className="h-4 w-4 text-[var(--hb-primary)]" />
                    <span>Location Details</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Select
                      label="Χώρα"
                      options={COUNTRIES}
                      value={formData.country || ''}
                      onChange={handleSelectChange('country')}
                    />
                    <Input
                      label="Πόλη"
                      type="text"
                      name="city"
                      value={locationCity}
                      onChange={e => setLocationCity(e.target.value)}
                      placeholder="π.χ. Αθήνα"
                    />
                    <Select
                      label="Ώρα (Time Zone)"
                      options={TIMEZONES}
                      value={formData.timezone || ''}
                      onChange={handleSelectChange('timezone')}
                    />
                    <div className="rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3 text-xs text-[var(--hb-muted)]">
                      Ασύγκριτα πιο επαγγελματικό: ενημερωμένα στοιχεία χώρας/πόλης και ζώνης ώρας
                      βοηθούν στο matchmaking και τα sessions.
                    </div>
                  </div>
                </div>

                <div>
                  <Textarea
                    label="Bio"
                    name="bio"
                    value={formData.bio || ''}
                    onChange={handleChange}
                    placeholder="Πες μας λίγα λόγια για σένα..."
                    rows={4}
                  />
                  <div className="mt-1 text-xs text-[var(--hb-muted)]">
                    {formData.bio?.length || 0} / 500 χαρακτήρες
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--hb-headline)]">
                      <Link2 className="h-4 w-4 text-[var(--hb-primary)]" />
                      <span>Social Presence</span>
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
                      2 στήλες • με icons
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {SOCIAL_PLATFORMS.map(platform => {
                      const Icon = platform.icon;
                      return (
                        <div
                          key={platform.key}
                          className="flex items-center gap-3 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3 shadow-inner shadow-black/40"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-primary)]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--hb-muted)]">
                              {platform.label}
                            </p>
                            <input
                              type="text"
                              value={socialLinks[platform.key] || ''}
                              onChange={e => handleSocialLinkChange(platform.key, e.target.value)}
                              placeholder={platform.placeholder}
                              className="mt-1 w-full rounded-lg border border-[var(--hb-border)] bg-[var(--hb-card)] px-3 py-2 text-sm text-[var(--hb-headline)] placeholder:text-[var(--hb-muted)] focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--hb-headline)]">
                      <Camera className="h-4 w-4 text-[var(--hb-primary)]" />
                      <span>Profile Photo</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)]">
                        {currentAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={currentAvatar}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-[var(--hb-muted)]">
                            No avatar
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--hb-muted)]">
                            Avatar Upload
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="block w-full text-xs text-[var(--hb-muted)] file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-[var(--hb-primary)] file:px-3 file:py-1 file:font-semibold file:uppercase file:tracking-wide file:text-[var(--hb-bg)] hover:file:opacity-90"
                          />
                          <p className="text-[11px] text-[var(--hb-muted)]">
                            Auto–avatar generation: placeholder για επόμενη έκδοση.
                          </p>
                        </div>
                        <Input
                          label="Σύνδεσμος Avatar"
                          type="text"
                          name="avatar_url"
                          value={(formData.avatar_url as string) || ''}
                          onChange={handleChange}
                          placeholder="https://..."
                        />
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={handleAvatarRemove}>
                            Κατάργηση
                          </Button>
                          <Button
                            type="button"
                            className="border border-dashed border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)]"
                            disabled
                          >
                            Auto-avatar (soon)
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--hb-headline)]">
                      <ShieldCheck className="h-4 w-4 text-[var(--hb-primary)]" />
                      <span>Privacy Settings</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { key: 'show_age', label: 'Εμφάνιση ηλικίας' },
                        { key: 'show_social_links', label: 'Εμφάνιση social links' },
                        { key: 'show_location', label: 'Εμφάνιση χώρας/πόλης' },
                      ].map(setting => {
                        const active = (privacySettings as Record<string, boolean>)[setting.key];
                        return (
                          <button
                            type="button"
                            key={setting.key}
                            onClick={() =>
                              togglePrivacySetting(setting.key as keyof typeof privacySettings)
                            }
                            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                              active
                                ? 'border-emerald-400/70 bg-emerald-500/10 text-emerald-50'
                                : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-text)] hover:border-[var(--hb-border)]'
                            }`}
                          >
                            <span className="text-sm font-medium">{setting.label}</span>
                            {active ? (
                              <Eye className="h-4 w-4 text-emerald-300" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-[var(--hb-muted)]" />
                            )}
                          </button>
                        );
                      })}
                      <p className="text-[11px] text-[var(--hb-muted)]">
                        Μικρές ρυθμίσεις που δίνουν κύρος και έλεγχο στο προφίλ σου.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories selection */}
            <Card
              id="categories"
              className="scroll-mt-24 overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur"
            >
              <CardHeader className="bg-[var(--hb-card)]/50 border-b border-[var(--hb-border)]">
                <p className="mb-1 text-xs uppercase tracking-[0.25em] text-[var(--hb-primary-strong)]">
                  Τα Hobbies μου
                </p>
                <CardTitle className="text-lg text-[var(--hb-headline)]">
                  Κατηγορίες χόμπι
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-[var(--hb-muted)]">
                  Επέλεξε τις κατηγορίες που σε ενδιαφέρουν. Θα εμφανίζονται μόνο τα σχετικά blocks
                  στις σελίδες σου.
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => {
                    const active = (formData.categories as string[] | undefined)?.includes(cat);
                    const labels: Record<string, string> = {
                      games: 'Games',
                      anime: 'Anime',
                      manga: 'Manga',
                      books: 'Books',
                      movies: 'Movies',
                      tv: 'TV Series',
                      coding: 'Coding',
                      pet: 'Pet',
                      vape: 'Vape',
                    };
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition ${
                          active
                            ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                            : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                        }`}
                      >
                        {labels[cat] || cat}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Gaming Information */}
            {(formData.categories as string[] | undefined)?.includes('games') ? (
              <Card
                collapsible
                className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur"
              >
                <CardHeader className="bg-[var(--hb-card)]/50 border-b border-[var(--hb-border)]">
                  <p className="mb-1 text-xs uppercase tracking-[0.25em] text-[var(--hb-primary-strong)]">
                    Gaming
                  </p>
                  <CardTitle className="text-lg text-[var(--hb-headline)]">
                    Πληροφορίες για Gaming
                  </CardTitle>
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
                    label="Αγαπημένη Κονσόλα"
                    options={['', ...PLATFORMS]}
                    value={formData.favorite_platform || ''}
                    onChange={handleSelectChange('favorite_platform')}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--hb-headline)]">
                      Αγαπημένα Genres
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map(genre => {
                        const active = formData.favorite_genres?.includes(genre);
                        return (
                          <button
                            type="button"
                            key={genre}
                            onClick={() => handleGenreToggle(genre)}
                            className={`rounded-full border px-3 py-1 text-xs transition ${
                              active
                                ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                                : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                            }`}
                          >
                            {genre}
                          </button>
                        );
                      })}
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
            ) : (
              <Card className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">
                    Πληροφορίες για Gaming
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-[var(--hb-muted)]">
                  Πρόσθεσε την κατηγορία &quot;Gaming&quot; για να εμφανιστεί η φόρμα με τα gaming
                  στοιχεία σου.
                </CardContent>
              </Card>
            )}

            {/* Anime Information */}
            {(formData.categories as string[] | undefined)?.includes('anime') ? (
              <Card
                collapsible
                className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur"
              >
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">Πληροφορίες για Anime</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const note = getCategoryNote('anime');
                    const platformsList =
                      Array.isArray(note.platforms) && (note.platforms as string[]).length > 0
                        ? (note.platforms as string[])
                        : [];
                    return (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--hb-headline)]">
                            Αγαπημένα Είδη Anime
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {ANIME_GENRES.map(genre => {
                              const active =
                                Array.isArray(note.genres) && note.genres.includes(genre);
                              return (
                                <button
                                  type="button"
                                  key={genre}
                                  onClick={() => handleCategoryGenreToggle('anime', genre)}
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                                      : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                                  }`}
                                >
                                  {genre}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--hb-headline)]">
                            Preferred Watching Format
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {ANIME_FORMATS.map(format => {
                              const active = note.format === format;
                              return (
                                <button
                                  type="button"
                                  key={format}
                                  onClick={() => handleCategoryNoteField('anime', 'format')(format)}
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                                      : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                                  }`}
                                >
                                  {format}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--hb-headline)]">
                            Preferred Source / Platform
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {ANIME_PLATFORMS.map(platform => {
                              const active = platformsList.includes(platform);
                              return (
                                <button
                                  type="button"
                                  key={platform}
                                  onClick={() =>
                                    handleCategoryListToggle('anime', 'platforms', platform)
                                  }
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                                      : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                                  }`}
                                >
                                  {platform}
                                </button>
                              );
                            })}
                          </div>
                          {platformsList.includes('Other') && (
                            <div className="mt-3">
                              <Input
                                label="Άλλη πλατφόρμα"
                                name="anime_platform_other"
                                value={(note.platform_other as string) || ''}
                                onChange={e =>
                                  handleCategoryNoteField('anime', 'platform_other')(e.target.value)
                                }
                                placeholder="π.χ. local streaming app"
                              />
                            </div>
                          )}
                        </div>

                        <Input
                          label="Watching Anime Since (Έτος)"
                          type="number"
                          name="anime_since"
                          value={(note.since as string | number | undefined) || ''}
                          onChange={e => handleCategoryNoteField('anime', 'since')(e.target.value)}
                          placeholder="π.χ. 2004"
                          min="1970"
                          max={new Date().getFullYear()}
                        />

                        <Textarea
                          label="Favorite Anime Directors / Studios"
                          name="anime_directors"
                          value={(note.directors as string) || ''}
                          onChange={e =>
                            handleCategoryNoteField('anime', 'directors')(e.target.value)
                          }
                          placeholder="Favorite directors / studios (π.χ. Miyazaki, Ufotable)"
                          rows={3}
                        />

                        <Textarea
                          label="Notes / Extra"
                          name="anime_notes"
                          value={(note.notes as string) || ''}
                          onChange={e => handleCategoryNoteField('anime', 'notes')(e.target.value)}
                          placeholder="Notes (sub/dub, Blu-ray collection, rewatch habits κ.λπ.)"
                          rows={3}
                        />
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">Πληροφορίες για Anime</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-[var(--hb-muted)]">
                  Πρόσθεσε την κατηγορία &quot;Anime&quot; για να εμφανιστεί η φόρμα με τα στοιχεία
                  σου.
                </CardContent>
              </Card>
            )}

            {/* Manga Information */}
            {(formData.categories as string[] | undefined)?.includes('manga') ? (
              <Card
                collapsible
                className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur"
              >
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">Πληροφορίες για manga</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const note = getCategoryNote('manga');
                    return (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--hb-headline)]">
                            Αγαπημένα Είδη / Demographics
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {MANGA_GENRES.map(genre => {
                              const active =
                                Array.isArray(note.genres) && note.genres.includes(genre);
                              return (
                                <button
                                  type="button"
                                  key={genre}
                                  onClick={() => handleCategoryGenreToggle('manga', genre)}
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                                      : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                                  }`}
                                >
                                  {genre}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--hb-headline)]">
                            Preferred Reading Format
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {MANGA_FORMATS.map(format => {
                              const active = note.format === format;
                              return (
                                <button
                                  type="button"
                                  key={format}
                                  onClick={() => handleCategoryNoteField('manga', 'format')(format)}
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                                      : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                                  }`}
                                >
                                  {format}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <Input
                          label="Reading Manga Since (Έτος)"
                          type="number"
                          name="manga_since"
                          value={(note.since as string | number | undefined) || ''}
                          onChange={e => handleCategoryNoteField('manga', 'since')(e.target.value)}
                          placeholder="π.χ. 2018"
                          min="1970"
                          max={new Date().getFullYear()}
                        />

                        <Textarea
                          label="Favorite Mangaka / Artists"
                          name="manga_authors"
                          value={(note.authors as string) || ''}
                          onChange={e =>
                            handleCategoryNoteField('manga', 'authors')(e.target.value)
                          }
                          placeholder="Favorite mangaka / artists"
                          rows={3}
                        />

                        <Textarea
                          label="Notes / Extra"
                          name="manga_notes"
                          value={(note.notes as string) || ''}
                          onChange={e => handleCategoryNoteField('manga', 'notes')(e.target.value)}
                          placeholder="Notes (συλλογή, εκδοτικοί, physical vs digital κ.λπ.)"
                          rows={3}
                        />
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">Πληροφορίες για manga</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-[var(--hb-muted)]">
                  Πρόσθεσε την κατηγορία &quot;Manga&quot; για να εμφανιστεί η φόρμα με τα στοιχεία
                  σου.
                </CardContent>
              </Card>
            )}

            {/* Movies Information */}
            {(formData.categories as string[] | undefined)?.includes('movies') ? (
              <Card
                collapsible
                className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur"
              >
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">
                    Πληροφορίες για Ταινίες
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const note = getCategoryNote('movies');
                    const serviceOptions = CATEGORY_SERVICES.movies || ['Other'];
                    const servicesList =
                      Array.isArray(note.services) && (note.services as string[]).length > 0
                        ? (note.services as string[])
                        : [];
                    return (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--hb-headline)]">
                            Αγαπημένες Πλατφόρμες Streaming / Watching
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {serviceOptions.map(service => {
                              const active = servicesList.includes(service);
                              return (
                                <button
                                  type="button"
                                  key={service}
                                  onClick={() =>
                                    handleCategoryListToggle('movies', 'services', service)
                                  }
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                                      : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                                  }`}
                                >
                                  {service}
                                </button>
                              );
                            })}
                          </div>
                          {servicesList.includes('Other') && (
                            <div className="mt-3">
                              <Input
                                label="Άλλη υπηρεσία"
                                name="movies_service_other"
                                value={(note.service_other as string) || ''}
                                onChange={e =>
                                  handleCategoryNoteField('movies', 'service_other')(e.target.value)
                                }
                                placeholder="π.χ. local cinema app"
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--hb-headline)]">
                            Αγαπημένα Genres Ταινιών
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {MOVIE_GENRES.map(genre => {
                              const active =
                                Array.isArray(note.genres) && note.genres.includes(genre);
                              return (
                                <button
                                  type="button"
                                  key={genre}
                                  onClick={() => handleCategoryGenreToggle('movies', genre)}
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                                      : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                                  }`}
                                >
                                  {genre}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--hb-headline)]">
                            Preferred Watching Style
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {MOVIE_STYLES.map(style => {
                              const active = note.style === style;
                              return (
                                <button
                                  type="button"
                                  key={style}
                                  onClick={() => handleCategoryNoteField('movies', 'style')(style)}
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                                      : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                                  }`}
                                >
                                  {style}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <Input
                          label="Watching Movies Since (Έτος)"
                          type="number"
                          name="movies_since"
                          value={(note.since as string | number | undefined) || ''}
                          onChange={e => handleCategoryNoteField('movies', 'since')(e.target.value)}
                          placeholder="π.χ. 2008"
                          min="1970"
                          max={new Date().getFullYear()}
                        />

                        <Textarea
                          label="Αγαπημένοι Σκηνοθέτες"
                          name="movies_directors"
                          value={(note.directors as string) || ''}
                          onChange={e =>
                            handleCategoryNoteField('movies', 'directors')(e.target.value)
                          }
                          placeholder="Αγαπημένοι σκηνοθέτες (π.χ. Nolan, Scorsese, Tarantino)"
                          rows={3}
                        />

                        <Textarea
                          label="Αγαπημένοι Ηθοποιοί"
                          name="movies_actors"
                          value={(note.actors as string) || ''}
                          onChange={e =>
                            handleCategoryNoteField('movies', 'actors')(e.target.value)
                          }
                          placeholder="Αγαπημένοι ηθοποιοί"
                          rows={3}
                        />
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">
                    Πληροφορίες για Ταινίες
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-[var(--hb-muted)]">
                  Πρόσθεσε την κατηγορία &quot;Movies&quot; για να εμφανιστεί η φόρμα με τα στοιχεία
                  σου.
                </CardContent>
              </Card>
            )}

            {/* TV Series Information */}
            {(formData.categories as string[] | undefined)?.includes('tv') ? (
              <Card
                collapsible
                className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur"
              >
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">
                    Πληροφορίες για Σειρές
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const note = getCategoryNote('tv');
                    const serviceOptions = CATEGORY_SERVICES.tv || ['Other'];
                    return (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--hb-headline)]">
                            Αγαπημένες Πλατφόρμες Streaming
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {serviceOptions.map(service => {
                              const list =
                                (note.services as string[] | undefined) &&
                                Array.isArray(note.services)
                                  ? (note.services as string[])
                                  : [];
                              const active = list.includes(service);
                              return (
                                <button
                                  type="button"
                                  key={service}
                                  onClick={() =>
                                    handleCategoryListToggle('tv', 'services', service)
                                  }
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                                      : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                                  }`}
                                >
                                  {service}
                                </button>
                              );
                            })}
                          </div>
                          {Array.isArray(note.services) && note.services.includes('Other') && (
                            <div className="mt-3">
                              <Input
                                label="Άλλη υπηρεσία"
                                name="tv_service_other"
                                value={(note.service_other as string) || ''}
                                onChange={e =>
                                  handleCategoryNoteField('tv', 'service_other')(e.target.value)
                                }
                                placeholder="π.χ. Cosmote TV"
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--hb-headline)]">
                            Αγαπημένα Genres Σειρών
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {TV_GENRES.map(genre => {
                              const active =
                                Array.isArray(note.genres) && note.genres.includes(genre);
                              return (
                                <button
                                  type="button"
                                  key={genre}
                                  onClick={() => handleCategoryGenreToggle('tv', genre)}
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                                      : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                                  }`}
                                >
                                  {genre}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--hb-headline)]">
                            Preferred Watching Style
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {TV_STYLES.map(style => {
                              const active = note.style === style;
                              return (
                                <button
                                  type="button"
                                  key={style}
                                  onClick={() => handleCategoryNoteField('tv', 'style')(style)}
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                                      : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                                  }`}
                                >
                                  {style}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <Input
                          label="Watching Since (Έτος)"
                          type="number"
                          name="tv_since"
                          value={(note.since as string | number | undefined) || ''}
                          onChange={e => handleCategoryNoteField('tv', 'since')(e.target.value)}
                          placeholder="π.χ. 2010"
                          min="1970"
                          max={new Date().getFullYear()}
                        />

                        <Textarea
                          name="tv_people"
                          value={(note.people as string) || ''}
                          onChange={e => handleCategoryNoteField('tv', 'people')(e.target.value)}
                          label="Αγαπημένοι Ηθοποιοί / Σκηνοθέτες"
                          placeholder="Αγαπημένοι ηθοποιοί/σκηνοθέτες ή έξτρα σημειώσεις."
                          rows={3}
                        />
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">
                    Πληροφορίες για Σειρές
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-[var(--hb-muted)]">
                  Πρόσθεσε την κατηγορία &quot;TV Series&quot; για να εμφανιστεί η φόρμα με τα
                  στοιχεία σου.
                </CardContent>
              </Card>
            )}

            {/* Books Information */}
            {(formData.categories as string[] | undefined)?.includes('books') ? (
              <Card
                collapsible
                className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur"
              >
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">
                    Πληροφορίες για Βιβλία
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const note = getCategoryNote('books');
                    return (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--hb-headline)]">
                            Αγαπημένα Είδη Βιβλίων
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {BOOK_GENRES.map(genre => {
                              const active =
                                Array.isArray(note.genres) && note.genres.includes(genre);
                              return (
                                <button
                                  type="button"
                                  key={genre}
                                  onClick={() => handleCategoryGenreToggle('books', genre)}
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                                      : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                                  }`}
                                >
                                  {genre}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--hb-headline)]">
                            Preferred Reading Format
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {BOOK_FORMATS.map(format => {
                              const active = note.format === format;
                              return (
                                <button
                                  type="button"
                                  key={format}
                                  onClick={() => handleCategoryNoteField('books', 'format')(format)}
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                                      : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                                  }`}
                                >
                                  {format}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <Input
                          label="Reading Since (Έτος)"
                          type="number"
                          name="books_since"
                          value={(note.since as string | number | undefined) || ''}
                          onChange={e => handleCategoryNoteField('books', 'since')(e.target.value)}
                          placeholder="π.χ. 2001"
                          min="1970"
                          max={new Date().getFullYear()}
                        />

                        <Textarea
                          label="Αγαπημένοι Συγγραφείς"
                          name="books_authors"
                          value={(note.authors as string) || ''}
                          onChange={e =>
                            handleCategoryNoteField('books', 'authors')(e.target.value)
                          }
                          placeholder="Αγαπημένοι συγγραφείς"
                          rows={3}
                        />

                        <Textarea
                          label="Σημειώσεις"
                          name="books_notes"
                          value={(note.notes as string) || ''}
                          onChange={e => handleCategoryNoteField('books', 'notes')(e.target.value)}
                          placeholder="Σημειώσεις / extra πληροφορίες"
                          rows={3}
                        />
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">
                    Πληροφορίες για Βιβλία
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-[var(--hb-muted)]">
                  Πρόσθεσε την κατηγορία &quot;Books&quot; για να εμφανιστεί η φόρμα με τα στοιχεία
                  σου.
                </CardContent>
              </Card>
            )}

            {/* Coding Information */}
            {(formData.categories as string[] | undefined)?.includes('coding') ? (
              <Card
                collapsible
                className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur"
              >
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">
                    Πληροφορίες για Κώδικα
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const note = getCategoryNote('coding');
                    return (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--hb-headline)]">
                            Γλώσσες που χρησιμοποιείς
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {CODING_LANGUAGES.map(lang => {
                              const list =
                                (note.languages as string[] | undefined) &&
                                Array.isArray(note.languages)
                                  ? (note.languages as string[])
                                  : [];
                              const active = list.includes(lang);
                              return (
                                <button
                                  type="button"
                                  key={lang}
                                  onClick={() =>
                                    handleCategoryListToggle('coding', 'languages', lang)
                                  }
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                                      : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                                  }`}
                                >
                                  {lang}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--hb-headline)]">
                            Focus / Κατεύθυνση
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {CODING_FOCUS.map(focus => {
                              const list =
                                (note.focus as string[] | undefined) && Array.isArray(note.focus)
                                  ? (note.focus as string[])
                                  : [];
                              const active = list.includes(focus);
                              return (
                                <button
                                  type="button"
                                  key={focus}
                                  onClick={() => handleCategoryListToggle('coding', 'focus', focus)}
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                                      : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                                  }`}
                                >
                                  {focus}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <Input
                            label="Coding Since (Έτος)"
                            type="number"
                            value={(note.since as string) || ''}
                            onChange={e =>
                              handleCategoryNoteField('coding', 'since')(e.target.value)
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
                              handleCategoryNoteField('coding', 'tools')(e.target.value)
                            }
                            placeholder="VS Code, Git, React..."
                          />
                        </div>

                        <Textarea
                          label="Σημειώσεις"
                          value={(note.notes as string) || ''}
                          onChange={e => handleCategoryNoteField('coding', 'notes')(e.target.value)}
                          placeholder="Τι σε εμπνέει στο coding, ποια projects αγαπάς..."
                          rows={3}
                        />
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">
                    Πληροφορίες για Κώδικα
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-[var(--hb-muted)]">
                  Πρόσθεσε την κατηγορία &quot;Coding&quot; για να εμφανιστεί η φόρμα με τα coding
                  στοιχεία σου.
                </CardContent>
              </Card>
            )}

            {/* Pet Information */}
            {(formData.categories as string[] | undefined)?.includes('pet') ? (
              <Card
                collapsible
                className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur"
              >
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">
                    Πληροφορίες για Κατοικίδια
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const note = getCategoryNote('pet');
                    return (
                      <>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Select
                            label="Είδος"
                            options={['', ...PET_TYPES]}
                            value={(note.type as string) || ''}
                            onChange={value => handleCategoryNoteField('pet', 'type')(value)}
                          />
                          <Input
                            label="Όνομα"
                            type="text"
                            value={(note.name as string) || ''}
                            onChange={e => handleCategoryNoteField('pet', 'name')(e.target.value)}
                            placeholder="π.χ. Luna"
                          />
                          <Input
                            label="Ράτσα / Breed"
                            type="text"
                            value={(note.breed as string) || ''}
                            onChange={e => handleCategoryNoteField('pet', 'breed')(e.target.value)}
                            placeholder="π.χ. Labrador"
                          />
                          <Input
                            label="Μαζί από (Έτος)"
                            type="number"
                            value={(note.since as string) || ''}
                            onChange={e => handleCategoryNoteField('pet', 'since')(e.target.value)}
                            placeholder="2019"
                            min="1970"
                            max={new Date().getFullYear()}
                          />
                        </div>

                        <Textarea
                          label="Μικρές ιστορίες"
                          value={(note.notes as string) || ''}
                          onChange={e => handleCategoryNoteField('pet', 'notes')(e.target.value)}
                          placeholder="Τι χαρακτήρα έχει, αγαπημένες συνήθειες..."
                          rows={3}
                        />
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">
                    Πληροφορίες για Κατοικίδια
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-[var(--hb-muted)]">
                  Πρόσθεσε την κατηγορία &quot;Pet&quot; για να εμφανιστεί η φόρμα με τα στοιχεία
                  του κατοικιδίου σου.
                </CardContent>
              </Card>
            )}

            {/* Vape Information */}
            {(formData.categories as string[] | undefined)?.includes('vape') ? (
              <Card
                collapsible
                className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur"
              >
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">Πληροφορίες για Vape</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const note = getCategoryNote('vape');
                    return (
                      <>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Select
                            label="Συσκευή"
                            options={['', ...VAPE_DEVICES]}
                            value={(note.device as string) || ''}
                            onChange={value => handleCategoryNoteField('vape', 'device')(value)}
                          />
                          <Input
                            label="Νικοτίνη (mg)"
                            type="number"
                            value={(note.nicotine as string) || ''}
                            onChange={e =>
                              handleCategoryNoteField('vape', 'nicotine')(e.target.value)
                            }
                            placeholder="3"
                            min="0"
                            max="50"
                          />
                          <Input
                            label="Vaping Since (Έτος)"
                            type="number"
                            value={(note.since as string) || ''}
                            onChange={e => handleCategoryNoteField('vape', 'since')(e.target.value)}
                            placeholder="2018"
                            min="1970"
                            max={new Date().getFullYear()}
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--hb-headline)]">
                            Αγαπημένες Γεύσεις
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {VAPE_FLAVORS.map(flavor => {
                              const list =
                                (note.flavors as string[] | undefined) &&
                                Array.isArray(note.flavors)
                                  ? (note.flavors as string[])
                                  : [];
                              const active = list.includes(flavor);
                              return (
                                <button
                                  type="button"
                                  key={flavor}
                                  onClick={() =>
                                    handleCategoryListToggle('vape', 'flavors', flavor)
                                  }
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                                      : 'border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-muted)] hover:border-[var(--hb-border)]'
                                  }`}
                                >
                                  {flavor}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <Textarea
                          label="Σημειώσεις"
                          value={(note.notes as string) || ''}
                          onChange={e => handleCategoryNoteField('vape', 'notes')(e.target.value)}
                          placeholder="Αγαπημένα υγρά, συνήθειες, προτιμήσεις..."
                          rows={3}
                        />
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.35)] backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-[var(--hb-headline)]">Πληροφορίες για Vape</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-[var(--hb-muted)]">
                  Πρόσθεσε την κατηγορία &quot;Vape&quot; για να εμφανιστεί η φόρμα με τα στοιχεία
                  για το vaping σου.
                </CardContent>
              </Card>
            )}

            {/* Bottom Save Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur">
              {/* Primary Button */}
              <Button
                type="submit"
                disabled={saving || !isDirty}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] px-6 py-2.5 font-semibold text-[var(--hb-bg)] shadow-[0_4px_12px_rgba(229,9,20,0.25),0_0_12px_rgba(229,9,20,0.45)] transition-all duration-300 hover:shadow-[0_6px_16px_rgba(229,9,20,0.35),0_0_18px_rgba(229,9,20,0.55)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Αποθήκευση...' : 'Αποθήκευση'}</span>
              </Button>
              {/* Secondary Button */}
              <Button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] px-6 py-2.5 font-medium text-[var(--hb-text)] shadow-[inset_0_0_8px_rgba(255,255,255,0.05)] backdrop-blur-lg transition-all duration-300 hover:border-[var(--hb-border)] hover:bg-[var(--hb-card)] active:scale-[0.97]"
              >
                <X className="h-4 w-4 text-[var(--hb-muted)]" />
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
              <p className="text-[var(--hb-text)]">
                Η διαγραφή του λογαριασμού σου είναι <strong>μόνιμη</strong> και δεν μπορεί να
                αναιρεθεί.
              </p>
              <p className="text-[var(--hb-muted)]">Θα διαγραφούν:</p>
              <ul className="mb-4 ml-4 list-disc space-y-1 text-[var(--hb-muted)]">
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
                    <label className="mb-2 block text-xs text-[var(--hb-text)]">
                      Πληκτρολόγησε{' '}
                      <code className="rounded bg-[var(--hb-card)] px-2 py-1 text-red-300">
                        ΔΙΑΓΡΑΦΗ
                      </code>{' '}
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
                      variant="outline"
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

      {/* Floating quick actions */}
      {isDirty && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-30 flex flex-col gap-2">
          <Button
            type="submit"
            form="edit-profile-form"
            disabled={saving}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--hb-primary-strong)] via-[var(--hb-primary)] to-[var(--hb-accent)] px-4 py-2 text-sm font-semibold text-[var(--hb-bg)] shadow-[0_10px_30px_rgba(229,9,20,0.35)] transition hover:shadow-[0_14px_36px_rgba(229,9,20,0.45)]"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
          </Button>
          <Button
            onClick={handleCancel}
            disabled={saving}
            className="pointer-events-auto rounded-full border border-[var(--hb-border)] bg-[var(--hb-card)] px-4 py-2 text-sm font-medium text-[var(--hb-text)] shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition hover:border-[var(--hb-border)] hover:bg-[var(--hb-card)]"
          >
            Ακύρωση
          </Button>
        </div>
      )}
    </div>
  );
}
