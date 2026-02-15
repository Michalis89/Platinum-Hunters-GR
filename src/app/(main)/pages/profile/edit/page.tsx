'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
  Save,
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
  CircleHelp,
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import {
  CollapsibleCard,
  CollapsibleCardContent,
  CollapsibleCardHeader,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { SelectField as Select } from '@/components/ui/select-field';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { selectUser, updateUserProfile, logout } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';
import type { User } from '@/types/user';
import { supabase } from '@/lib/supabase-client';
import { AvatarImage } from '@/components/ui/avatar-image';

function ProfileEditSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-16">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-2/3 rounded-full" />
            <Skeleton className="h-4 w-1/2 rounded-full" />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`profile-edit-skeleton-${index}`} className="h-12 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ANIME_GENRES,
  BOOK_GENRES,
  CATEGORY_SERVICES,
  CATEGORIES,
  CODING_FOCUS,
  CODING_LANGUAGES,
  COUNTRIES,
  GENRES,
  MOVIE_GENRES,
  MOVIE_STYLES,
  PET_TYPES,
  PLATFORMS,
  TV_GENRES,
  TV_STYLES,
  VAPE_FLAVORS,
} from '@/data/hobbyConstants';

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
  // Middleware ensures only authenticated users reach this page

  const [formData, setFormData] = useState<ProfileFormData>({
    favorite_anime_genres: [],
    favorite_movie_genres: [],
    favorite_book_genres: [],
    favorite_languages: [],
    pet_types: [],
    vape_device: '',
    vape_flavor: '',
  });
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
        favorite_anime_genres: user.favorite_anime_genres || [],
        favorite_movie_genres: user.favorite_movie_genres || [],
        favorite_book_genres: user.favorite_book_genres || [],
        favorite_languages: user.favorite_languages || [],
        gaming_since: user.gaming_since || null,
        categories: (user.categories as string[] | undefined) ?? ['games'],
        category_notes: initialCategoryNotes,
        pet_types: user.pet_types || [],
        vape_device: user.vape_device || '',
        vape_flavor: user.vape_flavor || '',
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
          favorite_anime_genres: user.favorite_anime_genres || [],
          favorite_movie_genres: user.favorite_movie_genres || [],
          favorite_book_genres: user.favorite_book_genres || [],
          favorite_languages: user.favorite_languages || [],
          gaming_since: user.gaming_since || null,
          categories: (user.categories as string[] | undefined) ?? ['games'],
          category_notes: initialCategoryNotes,
          pet_types: user.pet_types || [],
          vape_device: user.vape_device || '',
          vape_flavor: user.vape_flavor || '',
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

  // Show loading skeleton while user data loads from Redux
  if (!user) {
    return <ProfileEditSkeleton />;
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
      const fallbackGenres = (() => {
        if (cat === 'anime' || cat === 'manga') {
          return ((prev.favorite_anime_genres as string[] | undefined) || []).map(String);
        }
        if (cat === 'movies' || cat === 'tv') {
          return ((prev.favorite_movie_genres as string[] | undefined) || []).map(String);
        }
        if (cat === 'books') {
          return ((prev.favorite_book_genres as string[] | undefined) || []).map(String);
        }
        return [];
      })();
      const list: string[] = Array.isArray((current as { genres?: unknown }).genres)
        ? ((current as { genres?: string[] }).genres as string[])
        : fallbackGenres;
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

  const togglePetType = (type: string) => {
    setFormData(prev => {
      const current = (prev.pet_types as string[] | undefined) || [];
      const next = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
      return { ...prev, pet_types: next };
    });
  };

  const resolveGenreList = (
    note: Record<string, unknown> | undefined,
    fallback?: string[] | null,
  ) => {
    if (note && Array.isArray(note.genres) && note.genres.length) {
      return (note.genres as string[]).map(String);
    }
    return (fallback || []).map(String);
  };

  const resolveLanguageList = (
    note: Record<string, unknown> | undefined,
    fallback?: string[] | null,
  ) => {
    if (note && Array.isArray(note.languages) && note.languages.length) {
      return (note.languages as string[]).map(String);
    }
    return (fallback || []).map(String);
  };

  const deriveFavoritePayload = (notes: CategoryNotes | undefined) => {
    const categoryNotes =
      notes || (formData.category_notes as CategoryNotes) || EMPTY_CATEGORY_NOTES;
    const animeGenres = resolveGenreList(
      categoryNotes.anime as Record<string, unknown> | undefined,
      formData.favorite_anime_genres,
    );
    const movieGenres = resolveGenreList(
      categoryNotes.movies as Record<string, unknown> | undefined,
      formData.favorite_movie_genres,
    );
    const bookGenres = resolveGenreList(
      categoryNotes.books as Record<string, unknown> | undefined,
      formData.favorite_book_genres,
    );
    const codingLanguages = resolveLanguageList(
      categoryNotes.coding as Record<string, unknown> | undefined,
      formData.favorite_languages,
    );
    const noteVape = categoryNotes.vape as Record<string, unknown> | undefined;
    const noteVapeFlavors = Array.isArray(noteVape?.flavors) ? (noteVape.flavors as string[]) : [];
    const derivedVapeFlavor =
      noteVapeFlavors.length > 0
        ? noteVapeFlavors[0]
        : formData.vape_flavor
          ? String(formData.vape_flavor)
          : null;
    const derivedVapeDevice =
      (noteVape?.device as string | undefined) ||
      (formData.vape_device as string | undefined) ||
      null;

    return {
      favorite_anime_genres: animeGenres,
      favorite_movie_genres: movieGenres,
      favorite_book_genres: bookGenres,
      favorite_languages: codingLanguages,
      pet_types: (formData.pet_types as string[] | undefined) || [],
      vape_device: derivedVapeDevice,
      vape_flavor: derivedVapeFlavor,
    };
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

      const favoritePayload = deriveFavoritePayload(category_notes);

      await dispatch(
        updateUserProfile({
          userId: user.id,
          updates: {
            ...sanitizedRest,
            ...favoritePayload,
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
        message: 'Ο λογαριασμός διαγράφηκε. Ανακατεύθυνση στην αρχική σελίδα...',
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
    <div className="relative min-h-screen text-foreground">
      {/* Background gradient - Performance-first: no blur */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 4% -12%, hsl(var(--accent-primary) / 0.08), transparent 48%), radial-gradient(circle at 88% -10%, hsl(var(--accent-primary) / 0.06), transparent 44%)',
          }}
        />
      </div>

      <div className="relative px-4 py-10 md:px-6">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/dashboard' },
              { label: 'Profile', href: '/pages/profile' },
              { label: 'Edit Profile' },
            ]}
            className="mb-2"
          />

          {/* Hero-style Header */}
          <section className="mb-4 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">
              Account • Profile Settings
            </p>
            <h1 className="mb-2 text-3xl font-semibold leading-tight md:text-4xl">
              <span className="text-foreground">Επεξεργασία Προφίλ</span>
            </h1>
            <p className="mx-auto max-w-xl text-sm text-muted-foreground">
              Διαχειρίσου τις πληροφορίες, τα hobbies και τις ρυθμίσεις απορρήτου του λογαριασμού
              σου.
            </p>
          </section>

          {alert && (
            <Alert variant={alert.type === 'error' ? 'destructive' : 'success'} className="mb-6">
              {alert.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          )}

          <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <Card className="">
              <CardHeader className="border-b border-border bg-card/50">
                <p className="mb-1 text-xs uppercase tracking-[0.25em] text-primary">
                  Βασικά Στοιχεία
                </p>
                <CardTitle className="text-lg text-foreground">Προσωπικές Πληροφορίες</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-card/88 rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
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

                <div className="bg-card/88 rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
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
                  </div>
                </div>

                <div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Bio</label>
                    <Textarea
                      name="bio"
                      value={formData.bio || ''}
                      onChange={handleChange}
                      placeholder="Πες μας λίγα λόγια για σένα..."
                      rows={4}
                    />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formData.bio?.length || 0} / 500 χαρακτήρες
                  </div>
                </div>

                <div className="bg-card/88 rounded-lg border p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Link2 className="h-4 w-4 text-primary" />
                      <span>Social Presence</span>
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      2 στήλες • με icons
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {SOCIAL_PLATFORMS.map(platform => {
                      const Icon = platform.icon;
                      return (
                        <div
                          key={platform.key}
                          className="flex items-center gap-3 border bg-card/80 p-3"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border bg-muted text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {platform.label}
                            </p>
                            <input
                              type="text"
                              value={socialLinks[platform.key] || ''}
                              onChange={e => handleSocialLinkChange(platform.key, e.target.value)}
                              placeholder={platform.placeholder}
                              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="bg-card/88 rounded-lg border p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Camera className="h-4 w-4 text-primary" />
                      <span>Profile Photo</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-card">
                        {currentAvatar ? (
                          <AvatarImage
                            src={currentAvatar}
                            alt="Avatar"
                            size={80}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                            No avatar
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Avatar Upload
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="block w-full text-xs text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:font-semibold file:uppercase file:tracking-wide file:text-background hover:file:opacity-90"
                          />
                          <p className="text-[11px] text-muted-foreground">
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
                          <Button type="button" variant={'primary'} disabled>
                            Auto-avatar (soon)
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card/88 rounded-lg border p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary" />
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
                          <Button
                            type="button"
                            key={setting.key}
                            onClick={() =>
                              togglePrivacySetting(setting.key as keyof typeof privacySettings)
                            }
                            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                              active
                                ? `bg-primary/12 dark:bg-primary/22 border-primary/30 text-primary dark:border-primary/55 dark:text-[#8ec5ff]`
                                : `hover:bg-primary/8 border-border bg-card text-foreground hover:border-primary/35`
                            }`}
                          >
                            <span className="text-sm font-medium">{setting.label}</span>
                            {active ? (
                              <Eye className="h-4 w-4 text-primary" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        );
                      })}
                      <p className="text-[11px] text-muted-foreground">
                        Μικρές ρυθμίσεις που δίνουν κύρος και έλεγχο στο προφίλ σου.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories selection */}
            <Card id="categories" className="scroll-mt-24">
              <CardHeader className="border-b border-border bg-card/50">
                <p className="mb-1 text-xs uppercase tracking-[0.25em] text-primary">
                  Τα Hobbies μου
                </p>
                <CardTitle className="text-lg text-foreground">Κατηγορίες χόμπι</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
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
                      <Button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition ${
                          active
                            ? `bg-primary/14 dark:bg-primary/22 border-primary/35 text-primary dark:border-primary/55 dark:text-[#8ec5ff]`
                            : `hover:bg-primary/8 border-border bg-card text-muted-foreground hover:border-primary/35`
                        }`}
                      >
                        {labels[cat] || cat}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Gaming Information */}
            {(formData.categories as string[] | undefined)?.includes('games') ? (
              <CollapsibleCard className="">
                <CollapsibleCardHeader className="border-b border-border bg-card/50">
                  <p className="mb-1 text-xs uppercase tracking-[0.25em] text-primary">Gaming</p>
                  <CardTitle className="text-lg text-foreground">Πληροφορίες για Gaming</CardTitle>
                </CollapsibleCardHeader>
                <CollapsibleCardContent className="space-y-4">
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
                              Βρες το Steam ID από το προφίλ σου. Προτίμησε το 17-ψηφιο SteamID64
                              (π.χ. 7656119...). Δεκτό και vanity name ή URL από
                              steamcommunity.com/id/... καθώς και steamcommunity.com/profiles/...
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <input
                        type="text"
                        name="steam_id"
                        value={formData.steam_id || ''}
                        onChange={handleChange}
                        placeholder="76561198083126936 ή steamcommunity.com/id/yourname"
                        className="w-full rounded-lg border border-border bg-card p-3 text-foreground transition placeholder:text-muted-foreground placeholder:opacity-80 focus:border-primary focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

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
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Αγαπημένα Genres
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map(genre => {
                        const active = formData.favorite_genres?.includes(genre);
                        return (
                          <Button
                            type="button"
                            key={genre}
                            onClick={() => handleGenreToggle(genre)}
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
                    label="Gaming Since (Έτος)"
                    type="number"
                    name="gaming_since"
                    value={formData.gaming_since || ''}
                    onChange={handleChange}
                    placeholder="2005"
                    min="1970"
                    max={new Date().getFullYear()}
                  />
                </CollapsibleCardContent>
              </CollapsibleCard>
            ) : (
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-foreground">Πληροφορίες για Gaming</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Πρόσθεσε την κατηγορία &quot;Gaming&quot; για να εμφανιστεί η φόρμα με τα gaming
                  στοιχεία σου.
                </CardContent>
              </Card>
            )}

            {/* Anime Information */}
            {(formData.categories as string[] | undefined)?.includes('anime') ? (
              <CollapsibleCard className="">
                <CollapsibleCardHeader>
                  <CardTitle className="text-foreground">Πληροφορίες για Anime</CardTitle>
                </CollapsibleCardHeader>
                <CollapsibleCardContent className="space-y-4">
                  {(() => {
                    const note = getCategoryNote('anime');
                    const animeGenres = resolveGenreList(note, formData.favorite_anime_genres);
                    const platformsList =
                      Array.isArray(note.platforms) && (note.platforms as string[]).length > 0
                        ? (note.platforms as string[])
                        : [];
                    return (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground">
                            Αγαπημένα Είδη Anime
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {ANIME_GENRES.map(genre => {
                              const active = animeGenres.includes(genre);
                              return (
                                <Button
                                  type="button"
                                  key={genre}
                                  onClick={() => handleCategoryGenreToggle('anime', genre)}
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
                            Preferred Watching Format
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {ANIME_FORMATS.map(format => {
                              const active = note.format === format;
                              return (
                                <Button
                                  type="button"
                                  key={format}
                                  onClick={() => handleCategoryNoteField('anime', 'format')(format)}
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
                                    handleCategoryListToggle('anime', 'platforms', platform)
                                  }
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? `bg-primary/14 dark:bg-primary/22 border-primary/35 text-primary dark:border-primary/55 dark:text-[#8ec5ff]`
                                      : `hover:bg-primary/8 border-border bg-card text-muted-foreground hover:border-primary/35`
                                  }`}
                                >
                                  {platform}
                                </Button>
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

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">
                            Favorite Anime Directors / Studios
                          </label>
                          <Textarea
                            name="anime_directors"
                            value={(note.directors as string) || ''}
                            onChange={e =>
                              handleCategoryNoteField('anime', 'directors')(e.target.value)
                            }
                            placeholder="Favorite directors / studios (π.χ. Miyazaki, Ufotable)"
                            rows={3}
                          />
                        </div>
                      </>
                    );
                  })()}
                </CollapsibleCardContent>
              </CollapsibleCard>
            ) : (
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-foreground">Πληροφορίες για Anime</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Πρόσθεσε την κατηγορία &quot;Anime&quot; για να εμφανιστεί η φόρμα με τα στοιχεία
                  σου.
                </CardContent>
              </Card>
            )}

            {/* Manga Information */}
            {(formData.categories as string[] | undefined)?.includes('manga') ? (
              <CollapsibleCard className="">
                <CollapsibleCardHeader>
                  <CardTitle className="text-foreground">Πληροφορίες για manga</CardTitle>
                </CollapsibleCardHeader>
                <CollapsibleCardContent className="space-y-4">
                  {(() => {
                    const note = getCategoryNote('manga');
                    const mangaGenres = resolveGenreList(note, formData.favorite_anime_genres);
                    return (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground">
                            Αγαπημένα Είδη / Demographics
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {MANGA_GENRES.map(genre => {
                              const active = mangaGenres.includes(genre);
                              return (
                                <Button
                                  type="button"
                                  key={genre}
                                  onClick={() => handleCategoryGenreToggle('manga', genre)}
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
                                  onClick={() => handleCategoryNoteField('manga', 'format')(format)}
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
                          label="Reading Manga Since (Έτος)"
                          type="number"
                          name="manga_since"
                          value={(note.since as string | number | undefined) || ''}
                          onChange={e => handleCategoryNoteField('manga', 'since')(e.target.value)}
                          placeholder="π.χ. 2018"
                          min="1970"
                          max={new Date().getFullYear()}
                        />

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">
                            Favorite Mangaka / Artists
                          </label>
                          <Textarea
                            name="manga_authors"
                            value={(note.authors as string) || ''}
                            onChange={e =>
                              handleCategoryNoteField('manga', 'authors')(e.target.value)
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
            ) : (
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-foreground">Πληροφορίες για manga</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Πρόσθεσε την κατηγορία &quot;Manga&quot; για να εμφανιστεί η φόρμα με τα στοιχεία
                  σου.
                </CardContent>
              </Card>
            )}

            {/* Movies Information */}
            {(formData.categories as string[] | undefined)?.includes('movies') ? (
              <CollapsibleCard className="">
                <CollapsibleCardHeader>
                  <CardTitle className="text-foreground">Πληροφορίες για Ταινίες</CardTitle>
                </CollapsibleCardHeader>
                <CollapsibleCardContent className="space-y-4">
                  {(() => {
                    const note = getCategoryNote('movies');
                    const movieGenres = resolveGenreList(note, formData.favorite_movie_genres);
                    const serviceOptions = CATEGORY_SERVICES.movies || ['Other'];
                    const servicesList =
                      Array.isArray(note.services) && (note.services as string[]).length > 0
                        ? (note.services as string[])
                        : [];
                    return (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground">
                            Αγαπημένες Πλατφόρμες Streaming / Watching
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {serviceOptions.map(service => {
                              const active = servicesList.includes(service);
                              return (
                                <Button
                                  type="button"
                                  key={service}
                                  onClick={() =>
                                    handleCategoryListToggle('movies', 'services', service)
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
                          <label className="mb-2 block text-sm font-medium text-foreground">
                            Αγαπημένα Genres Ταινιών
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {MOVIE_GENRES.map(genre => {
                              const active = movieGenres.includes(genre);
                              return (
                                <Button
                                  type="button"
                                  key={genre}
                                  onClick={() => handleCategoryGenreToggle('movies', genre)}
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
                                  onClick={() => handleCategoryNoteField('movies', 'style')(style)}
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
                          label="Watching Movies Since (Έτος)"
                          type="number"
                          name="movies_since"
                          value={(note.since as string | number | undefined) || ''}
                          onChange={e => handleCategoryNoteField('movies', 'since')(e.target.value)}
                          placeholder="π.χ. 2008"
                          min="1970"
                          max={new Date().getFullYear()}
                        />

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">
                            Αγαπημένοι Ηθοποιοί / Σκηνοθέτες
                          </label>
                          <Textarea
                            name="movies_people"
                            value={(note.people as string) || ''}
                            onChange={e =>
                              handleCategoryNoteField('movies', 'people')(e.target.value)
                            }
                            placeholder="Αγαπημένοι ηθοποιοί ή σκηνοθέτες που σε εμπνέουν"
                            rows={3}
                          />
                        </div>
                      </>
                    );
                  })()}
                </CollapsibleCardContent>
              </CollapsibleCard>
            ) : (
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-foreground">Πληροφορίες για Ταινίες</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Πρόσθεσε την κατηγορία &quot;Movies&quot; για να εμφανιστεί η φόρμα με τα στοιχεία
                  σου.
                </CardContent>
              </Card>
            )}

            {/* TV Series Information */}
            {(formData.categories as string[] | undefined)?.includes('tv') ? (
              <CollapsibleCard className="">
                <CollapsibleCardHeader>
                  <CardTitle className="text-foreground">Πληροφορίες για Σειρές</CardTitle>
                </CollapsibleCardHeader>
                <CollapsibleCardContent className="space-y-4">
                  {(() => {
                    const note = getCategoryNote('tv');
                    const tvGenres = resolveGenreList(note, formData.favorite_movie_genres);
                    const serviceOptions = CATEGORY_SERVICES.tv || ['Other'];
                    return (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground">
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
                                <Button
                                  type="button"
                                  key={service}
                                  onClick={() =>
                                    handleCategoryListToggle('tv', 'services', service)
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
                          <label className="mb-2 block text-sm font-medium text-foreground">
                            Αγαπημένα Genres Σειρών
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {TV_GENRES.map(genre => {
                              const active = tvGenres.includes(genre);
                              return (
                                <Button
                                  type="button"
                                  key={genre}
                                  onClick={() => handleCategoryGenreToggle('tv', genre)}
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
                            {TV_STYLES.map(style => {
                              const active = note.style === style;
                              return (
                                <Button
                                  type="button"
                                  key={style}
                                  onClick={() => handleCategoryNoteField('tv', 'style')(style)}
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
                          label="Watching Since (Έτος)"
                          type="number"
                          name="tv_since"
                          value={(note.since as string | number | undefined) || ''}
                          onChange={e => handleCategoryNoteField('tv', 'since')(e.target.value)}
                          placeholder="π.χ. 2010"
                          min="1970"
                          max={new Date().getFullYear()}
                        />

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">
                            Αγαπημένοι Ηθοποιοί / Σκηνοθέτες
                          </label>
                          <Textarea
                            name="tv_people"
                            value={(note.people as string) || ''}
                            onChange={e => handleCategoryNoteField('tv', 'people')(e.target.value)}
                            placeholder="Αγαπημένοι ηθοποιοί/σκηνοθέτες ή έξτρα σημειώσεις."
                            rows={3}
                          />
                        </div>
                      </>
                    );
                  })()}
                </CollapsibleCardContent>
              </CollapsibleCard>
            ) : (
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-foreground">Πληροφορίες για Σειρές</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Πρόσθεσε την κατηγορία &quot;TV Series&quot; για να εμφανιστεί η φόρμα με τα
                  στοιχεία σου.
                </CardContent>
              </Card>
            )}

            {/* Books Information */}
            {(formData.categories as string[] | undefined)?.includes('books') ? (
              <CollapsibleCard className="">
                <CollapsibleCardHeader>
                  <CardTitle className="text-foreground">Πληροφορίες για Βιβλία</CardTitle>
                </CollapsibleCardHeader>
                <CollapsibleCardContent className="space-y-4">
                  {(() => {
                    const note = getCategoryNote('books');
                    const bookGenres = resolveGenreList(note, formData.favorite_book_genres);
                    return (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground">
                            Αγαπημένα Είδη Βιβλίων
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {BOOK_GENRES.map(genre => {
                              const active = bookGenres.includes(genre);
                              return (
                                <Button
                                  type="button"
                                  key={genre}
                                  onClick={() => handleCategoryGenreToggle('books', genre)}
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
                            {BOOK_FORMATS.map(format => {
                              const active = note.format === format;
                              return (
                                <Button
                                  type="button"
                                  key={format}
                                  onClick={() => handleCategoryNoteField('books', 'format')(format)}
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
                          label="Reading Since (Έτος)"
                          type="number"
                          name="books_since"
                          value={(note.since as string | number | undefined) || ''}
                          onChange={e => handleCategoryNoteField('books', 'since')(e.target.value)}
                          placeholder="π.χ. 2001"
                          min="1970"
                          max={new Date().getFullYear()}
                        />

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">
                            Αγαπημένοι Συγγραφείς
                          </label>
                          <Textarea
                            name="books_authors"
                            value={(note.authors as string) || ''}
                            onChange={e =>
                              handleCategoryNoteField('books', 'authors')(e.target.value)
                            }
                            placeholder="Αγαπημένοι συγγραφείς"
                            rows={3}
                          />
                        </div>
                      </>
                    );
                  })()}
                </CollapsibleCardContent>
              </CollapsibleCard>
            ) : (
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-foreground">Πληροφορίες για Βιβλία</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Πρόσθεσε την κατηγορία &quot;Books&quot; για να εμφανιστεί η φόρμα με τα στοιχεία
                  σου.
                </CardContent>
              </Card>
            )}

            {/* Coding Information */}
            {(formData.categories as string[] | undefined)?.includes('coding') ? (
              <CollapsibleCard className="">
                <CollapsibleCardHeader>
                  <CardTitle className="text-foreground">Πληροφορίες για Κώδικα</CardTitle>
                </CollapsibleCardHeader>
                <CollapsibleCardContent className="space-y-4">
                  {(() => {
                    const note = getCategoryNote('coding');
                    const codingLanguages = resolveLanguageList(note, formData.favorite_languages);
                    return (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground">
                            Γλώσσες που χρησιμοποιείς
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {CODING_LANGUAGES.map(lang => {
                              const active = codingLanguages.includes(lang);
                              return (
                                <Button
                                  type="button"
                                  key={lang}
                                  onClick={() =>
                                    handleCategoryListToggle('coding', 'languages', lang)
                                  }
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? `bg-primary/14 dark:bg-primary/22 border-primary/35 text-primary dark:border-primary/55 dark:text-[#8ec5ff]`
                                      : `hover:bg-primary/8 border-border bg-card text-muted-foreground hover:border-primary/35`
                                  }`}
                                >
                                  {lang}
                                </Button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground">
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
                                <Button
                                  type="button"
                                  key={focus}
                                  onClick={() => handleCategoryListToggle('coding', 'focus', focus)}
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? `bg-primary/14 dark:bg-primary/22 border-primary/35 text-primary dark:border-primary/55 dark:text-[#8ec5ff]`
                                      : `hover:bg-primary/8 border-border bg-card text-muted-foreground hover:border-primary/35`
                                  }`}
                                >
                                  {focus}
                                </Button>
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
                      </>
                    );
                  })()}
                </CollapsibleCardContent>
              </CollapsibleCard>
            ) : (
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-foreground">Πληροφορίες για Κώδικα</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Πρόσθεσε την κατηγορία &quot;Coding&quot; για να εμφανιστεί η φόρμα με τα coding
                  στοιχεία σου.
                </CardContent>
              </Card>
            )}

            {/* Pet Information */}
            {(formData.categories as string[] | undefined)?.includes('pet') ? (
              <CollapsibleCard className="">
                <CollapsibleCardHeader>
                  <CardTitle className="text-foreground">Πληροφορίες για Κατοικίδια</CardTitle>
                </CollapsibleCardHeader>
                <CollapsibleCardContent className="space-y-4">
                  {(() => {
                    const note = getCategoryNote('pet');
                    const petSelection = (formData.pet_types as string[] | undefined) || [];
                    const fallbackType = note.type ? [String(note.type)] : [];
                    const activePetTypes = petSelection.length > 0 ? petSelection : fallbackType;
                    const petEntries =
                      (note.entries as Record<string, Record<string, string>> | undefined) || {};
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
                    const handlePetEntryField = (type: string, key: string) => (value: string) => {
                      setFormData(prev => {
                        const notes =
                          (prev.category_notes as Record<string, unknown> | undefined) || {};
                        const petNote = (notes.pet as Record<string, unknown> | undefined) || {};
                        const entries =
                          (petNote.entries as Record<string, Record<string, string>> | undefined) ||
                          {};
                        const currentEntry =
                          (entries[type] as Record<string, string> | undefined) || {};
                        return {
                          ...prev,
                          category_notes: {
                            ...notes,
                            pet: {
                              ...petNote,
                              entries: {
                                ...entries,
                                [type]: {
                                  ...currentEntry,
                                  [key]: value,
                                },
                              },
                            },
                          },
                        };
                      });
                    };

                    return (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground">
                            Είδη Κατοικιδίων
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {PET_TYPES.map(type => {
                              const active = petSelection.includes(type);
                              return (
                                <Button
                                  type="button"
                                  key={`pet-type-${type}`}
                                  onClick={() => togglePetType(type)}
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? `bg-primary/14 dark:bg-primary/22 border-primary/35 text-primary dark:border-primary/55 dark:text-[#8ec5ff]`
                                      : `hover:bg-primary/8 border-border bg-card text-muted-foreground hover:border-primary/35`
                                  }`}
                                >
                                  {type}
                                </Button>
                              );
                            })}
                          </div>
                        </div>

                        {activePetTypes.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Επίλεξε ένα κατοικίδιο για να αποθηκευτούν τα στοιχεία του.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {activePetTypes.map(type => (
                              <div
                                key={`pet-entry-${type}`}
                                className="space-y-3 rounded-lg border bg-card/70 px-4 py-3"
                              >
                                <p className="text-sm font-semibold text-foreground">{type}</p>
                                <div className="grid gap-4 md:grid-cols-3">
                                  <Input
                                    label={`Όνομα (${type})`}
                                    type="text"
                                    value={getPetEntryValue(type, 'name')}
                                    onChange={e =>
                                      handlePetEntryField(type, 'name')(e.target.value)
                                    }
                                    placeholder={`Όνομα ${type.toLowerCase()}`}
                                  />
                                  <Input
                                    label="Φυλή"
                                    type="text"
                                    value={getPetEntryValue(type, 'breed')}
                                    onChange={e =>
                                      handlePetEntryField(type, 'breed')(e.target.value)
                                    }
                                    placeholder="π.χ. Labrador"
                                  />
                                  <Input
                                    label="Μαζί από (Έτος)"
                                    type="number"
                                    value={getPetEntryValue(type, 'since')}
                                    onChange={e =>
                                      handlePetEntryField(type, 'since')(e.target.value)
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
            ) : (
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-foreground">Πληροφορίες για Κατοικίδια</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Πρόσθεσε την κατηγορία &quot;Pet&quot; για να εμφανιστεί η φόρμα με τα στοιχεία
                  του κατοικιδίου σου.
                </CardContent>
              </Card>
            )}

            {/* Vape Information */}
            {(formData.categories as string[] | undefined)?.includes('vape') ? (
              <CollapsibleCard className="">
                <CollapsibleCardHeader>
                  <CardTitle className="text-foreground">Πληροφορίες για Vape</CardTitle>
                </CollapsibleCardHeader>
                <CollapsibleCardContent className="space-y-4">
                  {(() => {
                    const note = getCategoryNote('vape');
                    const vapeDeviceValue =
                      (note.device as string) || (formData.vape_device as string) || '';
                    const fallbackFlavor = formData.vape_flavor
                      ? [String(formData.vape_flavor)]
                      : [];
                    const vapeFlavors =
                      Array.isArray(note.flavors) && (note.flavors as string[]).length > 0
                        ? (note.flavors as string[])
                        : fallbackFlavor;
                    return (
                      <>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Input
                            label="Συσκευή"
                            type="text"
                            value={vapeDeviceValue}
                            onChange={e =>
                              handleCategoryNoteField('vape', 'device')(e.target.value)
                            }
                            placeholder="π.χ. Berserker B3"
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
                          <label className="mb-2 block text-sm font-medium text-foreground">
                            Αγαπημένες Γεύσεις
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {VAPE_FLAVORS.map(flavor => {
                              const active = vapeFlavors.includes(flavor);
                              return (
                                <Button
                                  type="button"
                                  key={flavor}
                                  onClick={() =>
                                    handleCategoryListToggle('vape', 'flavors', flavor)
                                  }
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    active
                                      ? `bg-primary/14 dark:bg-primary/22 border-primary/35 text-primary dark:border-primary/55 dark:text-[#8ec5ff]`
                                      : `hover:bg-primary/8 border-border bg-card text-muted-foreground hover:border-primary/35`
                                  }`}
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
            ) : (
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-foreground">Πληροφορίες για Vape</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Πρόσθεσε την κατηγορία &quot;Vape&quot; για να εμφανιστεί η φόρμα με τα στοιχεία
                  για το vaping σου.
                </CardContent>
              </Card>
            )}

            {/* Bottom Save Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 rounded-lg border bg-card/80 px-4 py-3 shadow-sm">
              {/* Primary Button */}
              <Button
                type="submit"
                variant={'primary'}
                disabled={saving || !isDirty}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Αποθήκευση...' : 'Αποθήκευση'}</span>
              </Button>
              {/* Secondary Button */}
              <Button
                onClick={handleCancel}
                disabled={saving}
                variant={'secondary'}
                className="flex items-center gap-2"
              >
                Ακύρωση
              </Button>
            </div>
          </form>

          {/* Danger Zone */}
          <Card className="">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#ff453a]">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-foreground">
                Η διαγραφή του λογαριασμού σου είναι <strong>μόνιμη</strong> και δεν μπορεί να
                αναιρεθεί.
              </p>
              <p className="text-muted-foreground">Θα διαγραφούν:</p>
              <ul className="mb-4 ml-4 list-disc space-y-1 text-muted-foreground">
                <li>Όλα τα προσωπικά σου δεδομένα</li>
                <li>Το προφίλ σου</li>
                <li>Οι οδηγοί που έχεις γράψει (αν υπάρχουν)</li>
                <li>Τα σχόλιά σου</li>
                <li>Το ιστορικό δραστηριότητάς σου</li>
              </ul>

              {!showDeleteConfirm ? (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-[#ff3b30]/14 flex items-center gap-2 border border-[#ff3b30]/55 px-5 py-2.5 font-semibold text-[#ff453a] shadow-sm transition hover:bg-[#ff3b30]/20"
                >
                  <Trash2 className="h-4 w-4" />
                  Διαγραφή Λογαριασμού
                </Button>
              ) : (
                <div className="bg-[#ff3b30]/12 space-y-4 border border-[#ff3b30]/45 p-4">
                  <p className="font-semibold text-[#ffb4ae]">
                    ⚠️ Είσαι σίγουρος; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί!
                  </p>
                  <div>
                    <label className="mb-2 block text-xs text-foreground">
                      Πληκτρολόγησε{' '}
                      <code className="rounded-[8px] bg-card px-2 py-1 text-[#ff6961]">
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
                      variant="destructive"
                      className="disabled:opacity-50"
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
        <div className="pointer-events-none fixed inset-x-4 bottom-4 z-30 flex flex-col gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6">
          <Button
            type="submit"
            form="edit-profile-form"
            disabled={saving}
            variant={'primary'}
            className="pointer-events-auto flex w-full items-center justify-center gap-2 sm:w-auto"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
          </Button>
          <Button
            onClick={handleCancel}
            disabled={saving}
            variant={'secondary'}
            className="pointer-events-auto w-full sm:w-auto"
          >
            Ακύρωση
          </Button>
        </div>
      )}
    </div>
  );
}
