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
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
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
import dynamic from 'next/dynamic';
import { CATEGORIES, COUNTRIES } from '@/data/hobbyConstants';

const ProfileCategoryTabs = dynamic(
  () => import('@/components/profile/profile-category-tabs').then(mod => mod.ProfileCategoryTabs),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
    ),
  },
);
const SOCIAL_PLATFORMS = [
  {
    key: 'discord',
    label: 'Discord',
    icon: MessageCircle,
    placeholder: 'username#1234 or invite link',
  },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@handle or url' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'channel / video url' },
  { key: 'twitch', label: 'Twitch', icon: Twitch, placeholder: 'twitch.tv/...' },
  { key: 'twitter', label: 'X / Twitter', icon: Twitter, placeholder: '@handle or url' },
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
  const [showNewUserInfo, setShowNewUserInfo] = useState(false);

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
      const userCategories = (user.categories as string[] | undefined) ?? [];
      const hasNoCategories = userCategories.length === 0;

      // Show info alert if user has no categories selected
      setShowNewUserInfo(hasNoCategories);

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
        categories: hasNoCategories ? [] : userCategories,
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

      // Hide the new user info alert when user selects at least one category
      if (next.length > 0 && showNewUserInfo) {
        setShowNewUserInfo(false);
      }

      return { ...prev, categories: next };
    });
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

      // Convert empty strings to null for unique constraint fields and date fields
      const emptyToNull = (val: string | null | undefined): string | null =>
        val && val.trim() !== '' ? val.trim() : null;

      const sanitizedRest = {
        ...rest,
        psn_id: emptyToNull(rest.psn_id),
        xbox_gamertag: emptyToNull(rest.xbox_gamertag),
        steam_id: emptyToNull(rest.steam_id),
        nintendo_id: emptyToNull(rest.nintendo_id),
        // Convert empty date fields to null to prevent date validation errors
        date_of_birth: emptyToNull(rest.date_of_birth),
        gaming_since: rest.gaming_since ?? null,
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

      setAlert({ type: 'success', message: 'Profile updated successfully.' });

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
        router.push('/profile');
      }, 1500);
    } catch (error) {
      console.error('Update error:', error);

      // Handle specific database constraint errors
      let errorMessage = 'Profile update failed. Please try again.';
      const errorStr = String(error);

      if (errorStr.includes('23505') || errorStr.includes('unique constraint')) {
        if (errorStr.includes('psn_id')) {
          errorMessage = 'This PSN ID is already used by another user.';
        } else if (errorStr.includes('username')) {
          errorMessage = 'This username is already in use.';
        } else if (errorStr.includes('email')) {
          errorMessage = 'This email is already in use.';
        } else {
          errorMessage = 'This value is already used by another user.';
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
    router.push('/profile');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setAlert({
        type: 'error',
        message: 'Type "DELETE" to confirm.',
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
        throw new Error(data.error || 'Failed to delete account');
      }
      const payload = data.data ?? data;
      void payload;

      setAlert({
        type: 'success',
        message: 'Account deleted. Redirecting to home page...',
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
        message: error instanceof Error ? error.message : 'Account deletion failed',
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
              { label: 'Profile', href: '/profile' },
              { label: 'Edit Profile' },
            ]}
            className="mb-2"
          />

          {/* Hero-style Header */}
          <section className="mb-4 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">
              Account - Profile Settings
            </p>
            <h1 className="mb-2 text-3xl font-semibold leading-tight md:text-4xl">
              <span className="text-foreground">Edit Profile</span>
            </h1>
            <p className="mx-auto max-w-xl text-sm text-muted-foreground">
              Manage your account details, hobbies, and privacy settings.
            </p>
          </section>

          {showNewUserInfo && (
            <Alert variant="info" className="mb-6">
              <AlertDescription>
                <strong>Welcome to Hobbistas Hub!</strong> As a new user, please select at least one
                hobby category below under{' '}
                <a
                  href="#categories"
                  className="font-semibold text-primary underline hover:text-primary/80"
                >
                  My Hobbies → Hobby Categories
                </a>
                . You can also configure additional settings like social links, articles, and reviews
                in{' '}
                <a href="/settings" className="font-semibold text-primary underline hover:text-primary/80">
                  Settings
                </a>
                . Don&apos;t forget to save your changes when you&apos;re done!
              </AlertDescription>
            </Alert>
          )}

          {alert && (
            <Alert variant={alert.type === 'error' ? 'destructive' : 'success'} className="mb-6">
              {alert.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{String(alert.message ?? '')}</AlertDescription>
            </Alert>
          )}

          <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <Card className="">
              <CardHeader className="border-b border-border bg-card/50">
                <p className="mb-1 text-xs uppercase tracking-[0.25em] text-primary">
                  Core Details
                </p>
                <CardTitle className="text-lg text-foreground">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-card/88 rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span>Account Information</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Username" value={user.username} disabled />
                    <Input
                      label="Display Name"
                      type="text"
                      name="display_name"
                      value={formData.display_name || ''}
                      onChange={handleChange}
                      placeholder="The name visible to everyone"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Full Name"
                    type="text"
                    name="full_name"
                    value={formData.full_name || ''}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />

                  <Input
                    label="Date of Birth"
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
                      label="Country"
                      options={COUNTRIES}
                      value={formData.country || ''}
                      onChange={handleSelectChange('country')}
                    />
                    <Input
                      label="City"
                      type="text"
                      name="city"
                      value={locationCity}
                      onChange={e => setLocationCity(e.target.value)}
                      placeholder="e.g. Athens"
                    />
                    <Select
                      label="Time Zone"
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
                      placeholder="Tell us a few words about yourself..."
                      rows={4}
                    />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formData.bio?.length || 0} / 500 characters
                  </div>
                </div>

                <div className="bg-card/88 rounded-lg border p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Link2 className="h-4 w-4 text-primary" />
                      <span>Social Presence</span>
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      2 columns - with icons
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
                            Auto-avatar generation: placeholder for a future release.
                          </p>
                        </div>
                        <Input
                          label="Avatar URL"
                          type="text"
                          name="avatar_url"
                          value={(formData.avatar_url as string) || ''}
                          onChange={handleChange}
                          placeholder="https://..."
                        />
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={handleAvatarRemove}>
                            Remove
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
                        { key: 'show_age', label: 'Show age' },
                        { key: 'show_social_links', label: 'Show social links' },
                        { key: 'show_location', label: 'Show country/city' },
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
                        Small settings that give you better control over your profile.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories selection */}
            <div
              id="categories"
              className="scroll-mt-24 rounded-xl border bg-card text-card-foreground shadow"
            >
              <div className="border-b border-border bg-card/50 p-6">
                <p className="mb-1 text-xs uppercase tracking-[0.25em] text-primary">My Hobbies</p>
                <CardTitle className="text-lg text-foreground">Hobby Categories</CardTitle>
              </div>
              <div className="space-y-3 p-6 pt-0">
                <p className="text-sm text-muted-foreground">
                  Select the categories that interest you. Only relevant blocks will appear on your
                  pages.
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
                        {String(labels[cat] || cat)}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            <Card>
              <CardHeader className="border-b border-border bg-card/50">
                <CardTitle className="text-lg text-foreground">Category Tabs</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ProfileCategoryTabs
                  categories={((formData.categories as string[] | undefined) ?? []).map(String)}
                  animeFavoriteGenres={(
                    (formData.favorite_anime_genres as string[] | undefined) || []
                  ).map(String)}
                  movieFavoriteGenres={(
                    (formData.favorite_movie_genres as string[] | undefined) || []
                  ).map(String)}
                  bookFavoriteGenres={(
                    (formData.favorite_book_genres as string[] | undefined) || []
                  ).map(String)}
                  codingFavoriteLanguages={(
                    (formData.favorite_languages as string[] | undefined) || []
                  ).map(String)}
                  gameForm={{
                    psn_id: (formData.psn_id as string | undefined) || '',
                    xbox_gamertag: (formData.xbox_gamertag as string | undefined) || '',
                    steam_id: (formData.steam_id as string | undefined) || '',
                    nintendo_id: (formData.nintendo_id as string | undefined) || '',
                    favorite_platform: (formData.favorite_platform as string | undefined) || '',
                    favorite_genres: (formData.favorite_genres as string[] | undefined) || [],
                    gaming_since:
                      (formData.gaming_since as string | number | null | undefined) ?? '',
                  }}
                  vapeFallback={{
                    device: (formData.vape_device as string | undefined) || '',
                    flavor: (formData.vape_flavor as string | undefined) || '',
                  }}
                  onGameFieldChange={(name, value) =>
                    setFormData(prev => ({ ...prev, [name]: value }))
                  }
                  onGamePlatformChange={handleSelectChange('favorite_platform')}
                  onGameGenreToggle={handleGenreToggle}
                  categoryNotes={
                    ((formData.category_notes as Record<string, unknown> | undefined) ||
                      {}) as Record<string, unknown>
                  }
                  petTypes={((formData.pet_types as string[] | undefined) || []).map(String)}
                  onPetTypeToggle={togglePetType}
                  onPetEntryField={(type, key, value) =>
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
                    })
                  }
                  onCategoryFieldChange={(cat, key, value) =>
                    handleCategoryNoteField(cat, key)(value)
                  }
                  onCategoryGenreToggle={handleCategoryGenreToggle}
                  onCategoryListToggle={handleCategoryListToggle}
                />
              </CardContent>
            </Card>

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
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </Button>
              {/* Secondary Button */}
              <Button
                onClick={handleCancel}
                disabled={saving}
                variant={'secondary'}
                className="flex items-center gap-2"
              >
                Cancel
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
                Deleting your account is <strong>permanent</strong> and cannot be undone.
              </p>
              <p className="text-muted-foreground">This action will delete:</p>
              <ul className="mb-4 ml-4 list-disc space-y-1 text-muted-foreground">
                <li>All your personal data</li>
                <li>Your profile</li>
                <li>Guides you have written (if any)</li>
                <li>Your comments</li>
                <li>Your activity history</li>
              </ul>

              {!showDeleteConfirm ? (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-[#ff3b30]/14 flex items-center gap-2 border border-[#ff3b30]/55 px-5 py-2.5 font-semibold text-[#ff453a] shadow-sm transition hover:bg-[#ff3b30]/20"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              ) : (
                <div className="bg-[#ff3b30]/12 space-y-4 border border-[#ff3b30]/45 p-4">
                  <p className="font-semibold text-[#ffb4ae]">
                    Are you sure? This action cannot be undone.
                  </p>
                  <div>
                    <label className="mb-2 block text-xs text-foreground">
                      Type{' '}
                      <code className="rounded-[8px] bg-card px-2 py-1 text-[#ff6961]">DELETE</code>{' '}
                      to confirm:
                    </label>
                    <Input
                      type="text"
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
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
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteConfirmText !== 'DELETE'}
                      variant="destructive"
                      className="disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleting ? 'Deleting...' : 'Delete Permanently'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
