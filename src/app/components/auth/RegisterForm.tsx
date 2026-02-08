'use client';

import { useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Check,
  Gamepad2,
  Sparkles,
  BookOpen,
  Film,
  Tv,
  Code,
  Cat,
  Wind,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Textarea } from '@/app/components/ui/Textarea';
import FormErrorMessage from '@/app/components/ui/FormErrorMessage';
import AlertMessage from '@/app/components/ui/AlertMessage';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validatePasswordConfirm,
  validateFullName,
  validateDateOfBirth,
  validatePSNId,
  validateBio,
  getPasswordStrength,
} from '@/utils/validation/auth';
import type { RegisterData } from '@/types/auth';
import { Button } from '@/components/ui/button';
import CaptchaWidget from '@/app/components/auth/CaptchaWidget';
import {
  ANIME_GENRES,
  BOOK_GENRES,
  CODING_LANGUAGES,
  COUNTRIES,
  GENRES,
  MOVIE_GENRES,
  PET_TYPES,
  PLATFORMS,
} from '@/data/hobbyConstants';
const HOBBIES = [
  { id: 'games', label: 'Games', icon: 'Gamepad2' },
  { id: 'anime', label: 'Anime', icon: 'Sparkles' },
  { id: 'manga', label: 'Manga', icon: 'BookOpen' },
  { id: 'movies', label: 'Ταινίες', icon: 'Film' },
  { id: 'tv', label: 'Σειρές', icon: 'Tv' },
  { id: 'books', label: 'Βιβλία', icon: 'BookOpen' },
  { id: 'coding', label: 'Coding', icon: 'Code' },
  { id: 'pet', label: 'Κατοικίδια', icon: 'Cat' },
  { id: 'vape', label: 'Vape', icon: 'Wind' },
];

const isCaptchaDisabled = process.env.NODE_ENV === 'development';

type PreferenceSectionProps = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  sectionKey: string;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
  children: ReactNode;
};

const PreferenceSection = ({
  title,
  icon: Icon,
  sectionKey,
  isOpen,
  onToggle,
  className = '',
  children,
}: PreferenceSectionProps) => (
  <div className={`apple-auth-section space-y-4 px-4 py-4 ${className}`}>
    <div className="flex items-center justify-between">
      <p className="apple-body-tracking flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--apple-secondary-label)]">
        <Icon className="h-4 w-4" />
        {title}
      </p>
      <Button
        type="button"
        variant={'secondary'}
        onClick={onToggle}
        className="h-8 gap-1"
      >
        {isOpen ? (
          <>
            Απόκρυψη
            <ChevronUp className="h-3 w-3" />
          </>
        ) : (
          <>
            Εμφάνιση
            <ChevronDown className="h-3 w-3" />
          </>
        )}
      </Button>
    </div>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key={`${sectionKey}-content`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4 overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

interface RegisterFormProps {
  readonly onSuccess?: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get redirect URL from query param
  const redirectParam = searchParams.get('redirect');

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [openPreferences, setOpenPreferences] = useState<Record<string, boolean>>({
    gaming: true,
    anime: true,
    movies: true,
    books: true,
    coding: true,
    pet: true,
    vape: true,
  });
  const togglePreference = (key: string) => {
    setOpenPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const inputClasses =
    'bg-[var(--hb-input-bg)] text-[var(--apple-label)] placeholder:text-[var(--apple-secondary-label)]';
  const selectClasses =
    'bg-[var(--hb-input-bg)] text-[var(--apple-label)]';

  const [formData, setFormData] = useState<
    Partial<RegisterData> & {
      favorite_hobbies?: string[];
      favorite_anime_genres?: string[];
      favorite_movie_genres?: string[];
      favorite_book_genres?: string[];
      favorite_languages?: string[];
      pet_types?: string[];
      vape_device?: string;
      vape_flavor?: string;
    }
  >({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
    agree_to_terms: false,
    full_name: '',
    date_of_birth: '',
    country: 'GR',
    bio: '',
    psn_id: '',
    favorite_platform: '',
    favorite_genres: [],
    favorite_hobbies: [],
    favorite_anime_genres: [],
    favorite_movie_genres: [],
    favorite_book_genres: [],
    favorite_languages: [],
    pet_types: [],
    vape_device: '',
    vape_flavor: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    const emailVal = validateEmail(formData.email || '');
    if (!emailVal.isValid) newErrors.email = emailVal.error!;

    const usernameVal = validateUsername(formData.username || '');
    if (!usernameVal.isValid) newErrors.username = usernameVal.error!;

    const passwordVal = validatePassword(formData.password || '');
    if (!passwordVal.isValid) newErrors.password = passwordVal.error!;

    const passwordConfirmVal = validatePasswordConfirm(
      formData.password || '',
      formData.password_confirm || '',
    );
    if (!passwordConfirmVal.isValid) newErrors.password_confirm = passwordConfirmVal.error!;

    if (!formData.agree_to_terms) {
      newErrors.agree_to_terms = 'Πρέπει να αποδεχτείς τους όρους χρήσης';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameVal = validateFullName(formData.full_name || '');
    if (!nameVal.isValid) newErrors.full_name = nameVal.error!;

    const dobVal = validateDateOfBirth(formData.date_of_birth || '');
    if (!dobVal.isValid) newErrors.date_of_birth = dobVal.error!;

    if (!formData.country) {
      newErrors.country = 'Η χώρα είναι υποχρεωτική';
    }

    const bioVal = validateBio(formData.bio || '');
    if (!bioVal.isValid) newErrors.bio = bioVal.error!;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.psn_id) {
      const psnVal = validatePSNId(formData.psn_id);
      if (!psnVal.isValid) newErrors.psn_id = psnVal.error!;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;

    if (currentStep === 1) isValid = validateStep1();
    else if (currentStep === 2) isValid = validateStep2();
    else if (currentStep === 3) isValid = validateStep3();

    if (isValid && currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else if (isValid && currentStep === 3) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setAlert(null);

    if (!isCaptchaDisabled && !captchaToken) {
      setCaptchaError('Ολοκλήρωσε το CAPTCHA για να συνεχίσεις.');
      return;
    }

    setCaptchaError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          full_name: formData.full_name,
          date_of_birth: formData.date_of_birth,
          country: formData.country,
          bio: formData.bio || null,
          psn_id: formData.psn_id || null,
          favorite_platform: formData.favorite_platform || null,
          favorite_genres: formData.favorite_genres || null,
          categories: formData.favorite_hobbies || null,
          favorite_anime_genres: formData.favorite_anime_genres || null,
          favorite_movie_genres: formData.favorite_movie_genres || null,
          favorite_book_genres: formData.favorite_book_genres || null,
          favorite_languages: formData.favorite_languages || null,
          pet_types: formData.pet_types || null,
          vape_device: formData.vape_device || null,
          vape_flavor: formData.vape_flavor || null,
          captchaToken: isCaptchaDisabled ? 'dev-bypass' : captchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Σφάλμα εγγραφής');
      }

      setAlert({
        type: 'success',
        message: 'Σου στείλαμε email επιβεβαίωσης. Έλεγξε τα εισερχόμενά σου.',
      });

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          const targetUrl = redirectParam ? decodeURIComponent(redirectParam) : '/pages/auth/login';
          router.push(targetUrl);
        }
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error && error.message.toLowerCase().includes('captcha')) {
        setCaptchaError('CAPTCHA failed. Retry it, and refresh the page if it persists.');
        setCaptchaResetKey(prev => prev + 1);
        setCaptchaToken(null);
        setAlert({
          type: 'error',
          message:
            'CAPTCHA verification failed. Please retry. If it keeps failing, refresh and try again.',
        });
        return;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Σφάλμα εγγραφής. Δοκιμάστε ξανά.';
      setAlert({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / 3) * 100;

  return (
    <Card className="apple-auth-card flex h-[min(90vh,820px)] min-h-[700px] flex-col overflow-hidden">
      <CardHeader className="flex-none border-[var(--apple-separator-soft)] bg-transparent px-6 pb-5 pt-6">
        <CardTitle className="flex items-center justify-between text-[var(--apple-label)]">
          <span className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--apple-radius-control)] bg-[color-mix(in_srgb,var(--apple-system-blue)_15%,transparent)] text-[var(--apple-system-blue)]">
              <UserPlus className="h-5 w-5" />
            </div>
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-semibold">
                {currentStep === 1 && 'Στοιχεία Λογαριασμού'}
                {currentStep === 2 && 'Προσωπικά Στοιχεία'}
                {currentStep === 3 && 'Τα Χόμπι σου'}
              </span>
              <span className="apple-body-tracking text-xs text-[var(--apple-secondary-label)]">
                Βήμα {currentStep} από 3
              </span>
            </span>
          </span>
        </CardTitle>
        <div className="apple-progress-track mt-4 h-2 w-full rounded-full">
          <motion.div
            className="apple-progress-fill h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col overflow-hidden px-6 pb-0 pt-5">
        <div className="flex-1 overflow-y-auto pr-1">
          {alert && <AlertMessage type={alert.type} message={alert.message} />}

          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    error={!!errors.email}
                    className={inputClasses}
                    required
                  />
                  <FormErrorMessage message={errors.email} />
                </div>

                <div>
                  <Input
                    label="Username"
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="gamer123"
                    error={!!errors.username}
                    className={inputClasses}
                    required
                  />
                  <FormErrorMessage message={errors.username} />
                </div>

                <div>
                  <div className="relative">
                    <Input
                      label="Κωδικός"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      error={!!errors.password}
                      className={inputClasses}
                      required
                    />
                    <Button
                      type="button"
                      variant={'ghost'}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-[33px] h-8 w-8 rounded-[10px]"
                      ariaLabel={showPassword ? 'Απόκρυψη κωδικού' : 'Εμφάνιση κωδικού'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {passwordStrength && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="apple-progress-track h-2 flex-1 rounded-full">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(passwordStrength.score / 4) * 100}%`,
                              backgroundColor: passwordStrength.color,
                            }}
                          />
                        </div>
                        <span style={{ color: passwordStrength.color }}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      {passwordStrength.errors.length > 0 && (
                        <ul className="apple-body-tracking mt-1 text-xs text-[var(--apple-secondary-label)]">
                          {passwordStrength.errors.map((err, i) => (
                            <li key={i}>• {err}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  <FormErrorMessage message={errors.password} />
                </div>

                <div>
                  <div className="relative">
                    <Input
                      label="Επιβεβαίωση Κωδικού"
                      type={showPasswordConfirm ? 'text' : 'password'}
                      name="password_confirm"
                      value={formData.password_confirm}
                      onChange={handleChange}
                      placeholder="••••••••"
                      error={!!errors.password_confirm}
                      className={inputClasses}
                      required
                    />
                    <Button
                      type="button"
                      variant={'ghost'}
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-2.5 top-[33px] h-8 w-8 rounded-[10px]"
                      ariaLabel={showPasswordConfirm ? 'Απόκρυψη κωδικού' : 'Εμφάνιση κωδικού'}
                    >
                      {showPasswordConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormErrorMessage message={errors.password_confirm} />
                </div>

                <div>
                  <label className="apple-body-tracking mt-2 flex items-start gap-2 text-sm text-[var(--apple-label)]">
                    <input
                      type="checkbox"
                      name="agree_to_terms"
                      checked={formData.agree_to_terms}
                      onChange={handleChange}
                      className="apple-auth-checkbox mt-1 h-4 w-4 rounded-[7px] border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)]"
                    />
                    <span>
                      Αποδέχομαι τους{' '}
                      <Link
                        href="/pages/terms"
                        className="font-semibold text-[var(--apple-system-blue)] transition hover:opacity-80"
                      >
                        όρους χρήσης
                      </Link>{' '}
                      και την{' '}
                      <Link
                        href="/pages/privacy"
                        className="font-semibold text-[var(--apple-system-blue)] transition hover:opacity-80"
                      >
                        πολιτική απορρήτου
                      </Link>
                    </span>
                  </label>
                  <FormErrorMessage message={errors.agree_to_terms} />
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <Input
                    label="Ονοματεπώνυμο"
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Γιάννης Παπαδόπουλος"
                    error={!!errors.full_name}
                    className={inputClasses}
                    required
                  />
                  <FormErrorMessage message={errors.full_name} />
                </div>

                <div>
                  <Input
                    label="Ημερομηνία Γέννησης"
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    error={!!errors.date_of_birth}
                    className={inputClasses}
                    required
                  />
                  <FormErrorMessage message={errors.date_of_birth} />
                </div>

                <div>
                  <Select
                    label="Χώρα"
                    options={COUNTRIES}
                    value={formData.country}
                    onChange={handleSelectChange('country')}
                    className={selectClasses}
                  />
                  <FormErrorMessage message={errors.country} />
                </div>

                <div>
                  <Textarea
                    label="Bio (προαιρετικό)"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Πες μας λίγα λόγια για σένα..."
                    rows={3}
                    className={`${inputClasses} min-h-[120px]`}
                  />
                  <div className="apple-body-tracking mt-1 text-xs text-[var(--apple-secondary-label)]">
                    {formData.bio?.length || 0} / 500
                  </div>
                  <FormErrorMessage message={errors.bio} />
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <p className="mb-2 text-sm font-medium text-[var(--apple-label)]">
                    Ποια χόμπι σε ενδιαφέρουν;
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {HOBBIES.map(hobby => {
                      const isSelected = formData.favorite_hobbies?.includes(hobby.id);
                      const IconComponent =
                        {
                          Gamepad2,
                          Sparkles,
                          BookOpen,
                          Film,
                          Tv,
                          Code,
                          Cat,
                          Wind,
                        }[hobby.icon] || Gamepad2;

                      return (
                        <Button
                          key={hobby.id}
                          type="button"
                          onClick={() => {
                            const hobbies = formData.favorite_hobbies || [];
                            if (isSelected) {
                              setFormData(prev => ({
                                ...prev,
                                favorite_hobbies: hobbies.filter(h => h !== hobby.id),
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                favorite_hobbies: [...hobbies, hobby.id],
                              }));
                            }
                          }}
                          className={`apple-auth-chip flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm ${
                            isSelected
                              ? 'border-[var(--apple-system-blue)]/45 bg-[var(--apple-system-blue)]/14 text-[var(--apple-system-blue)]'
                              : 'text-[var(--apple-secondary-label)] hover:border-[var(--apple-system-blue)]/45 hover:text-[var(--apple-label)]'
                          }`}
                        >
                          <IconComponent className="h-4 w-4" />
                          {hobby.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Gaming preferences */}
                {formData.favorite_hobbies?.includes('games') && (
                  <PreferenceSection
                    title="Gaming"
                    icon={Gamepad2}
                    sectionKey="gaming"
                    isOpen={openPreferences.gaming}
                    onToggle={() => togglePreference('gaming')}
                    className=""
                  >
                    <>
                      <div>
                        <Input
                          label="PSN ID (προαιρετικό)"
                          type="text"
                          name="psn_id"
                          value={formData.psn_id}
                          onChange={handleChange}
                          placeholder="YourPSNID"
                          error={!!errors.psn_id}
                          className={inputClasses}
                        />
                        <FormErrorMessage message={errors.psn_id} />
                      </div>
                      <div>
                        <Select
                          label="Αγαπημένη Κονσόλα"
                          options={['', ...PLATFORMS]}
                          value={formData.favorite_platform}
                          onChange={handleSelectChange('favorite_platform')}
                          className={selectClasses}
                        />
                      </div>
                      <div className="text-sm">
                        <p className="apple-body-tracking mb-2 text-xs text-[var(--apple-secondary-label)]">
                          Αγαπημένα Genres:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {GENRES.map(genre => (
                            <label
                              key={genre}
                              className="apple-body-tracking flex items-center gap-2 text-[var(--apple-secondary-label)]"
                            >
                              <input
                                type="checkbox"
                                checked={formData.favorite_genres?.includes(genre)}
                                onChange={e => {
                                  const genres = formData.favorite_genres || [];
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      favorite_genres: [...genres, genre],
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      favorite_genres: genres.filter(g => g !== genre),
                                    }));
                                  }
                                }}
                                className="apple-auth-checkbox h-4 w-4 rounded-[7px] border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)]"
                              />
                              {genre}
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  </PreferenceSection>
                )}

                {/* Anime/Manga preferences */}
                {(formData.favorite_hobbies?.includes('anime') ||
                  formData.favorite_hobbies?.includes('manga')) && (
                  <PreferenceSection
                    title="Anime & Manga"
                    icon={Sparkles}
                    sectionKey="anime"
                    isOpen={openPreferences.anime}
                    onToggle={() => togglePreference('anime')}
                    className=""
                  >
                    <>
                      <div className="text-sm">
                        <p className="apple-body-tracking mb-2 text-xs text-[var(--apple-secondary-label)]">
                          Αγαπημένα Genres:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {ANIME_GENRES.map(genre => (
                            <label
                              key={genre}
                              className="apple-body-tracking flex items-center gap-2 text-[var(--apple-secondary-label)]"
                            >
                              <input
                                type="checkbox"
                                checked={formData.favorite_anime_genres?.includes(genre)}
                                onChange={e => {
                                  const genres = formData.favorite_anime_genres || [];
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      favorite_anime_genres: [...genres, genre],
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      favorite_anime_genres: genres.filter(g => g !== genre),
                                    }));
                                  }
                                }}
                                className="apple-auth-checkbox h-4 w-4 rounded-[7px] border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)]"
                              />
                              {genre}
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  </PreferenceSection>
                )}

                {/* Movies/TV preferences */}
                {(formData.favorite_hobbies?.includes('movies') ||
                  formData.favorite_hobbies?.includes('tv')) && (
                  <PreferenceSection
                    title="Ταινίες & Σειρές"
                    icon={Film}
                    sectionKey="movies"
                    isOpen={openPreferences.movies}
                    onToggle={() => togglePreference('movies')}
                    className=""
                  >
                    <>
                      <div className="text-sm">
                        <p className="apple-body-tracking mb-2 text-xs text-[var(--apple-secondary-label)]">
                          Αγαπημένα Genres:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {MOVIE_GENRES.map(genre => (
                            <label
                              key={genre}
                              className="apple-body-tracking flex items-center gap-2 text-[var(--apple-secondary-label)]"
                            >
                              <input
                                type="checkbox"
                                checked={formData.favorite_movie_genres?.includes(genre)}
                                onChange={e => {
                                  const genres = formData.favorite_movie_genres || [];
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      favorite_movie_genres: [...genres, genre],
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      favorite_movie_genres: genres.filter(g => g !== genre),
                                    }));
                                  }
                                }}
                                className="apple-auth-checkbox h-4 w-4 rounded-[7px] border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)]"
                              />
                              {genre}
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  </PreferenceSection>
                )}

                {/* Books preferences */}
                {formData.favorite_hobbies?.includes('books') && (
                  <PreferenceSection
                    title="Βιβλία"
                    icon={BookOpen}
                    sectionKey="books"
                    isOpen={openPreferences.books}
                    onToggle={() => togglePreference('books')}
                    className=""
                  >
                    <>
                      <div className="text-sm">
                        <p className="apple-body-tracking mb-2 text-xs text-[var(--apple-secondary-label)]">
                          Αγαπημένα Genres:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {BOOK_GENRES.map(genre => (
                            <label
                              key={genre}
                              className="apple-body-tracking flex items-center gap-2 text-[var(--apple-secondary-label)]"
                            >
                              <input
                                type="checkbox"
                                checked={formData.favorite_book_genres?.includes(genre)}
                                onChange={e => {
                                  const genres = formData.favorite_book_genres || [];
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      favorite_book_genres: [...genres, genre],
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      favorite_book_genres: genres.filter(g => g !== genre),
                                    }));
                                  }
                                }}
                                className="apple-auth-checkbox h-4 w-4 rounded-[7px] border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)]"
                              />
                              {genre}
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  </PreferenceSection>
                )}

                {/* Coding preferences */}
                {formData.favorite_hobbies?.includes('coding') && (
                  <PreferenceSection
                    title="Coding"
                    icon={Code}
                    sectionKey="coding"
                    isOpen={openPreferences.coding}
                    onToggle={() => togglePreference('coding')}
                    className=""
                  >
                    <>
                      <div className="text-sm">
                        <p className="apple-body-tracking mb-2 text-xs text-[var(--apple-secondary-label)]">
                          Αγαπημένες Γλώσσες:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {CODING_LANGUAGES.map(lang => (
                            <label
                              key={lang}
                              className="apple-body-tracking flex items-center gap-2 text-[var(--apple-secondary-label)]"
                            >
                              <input
                                type="checkbox"
                                checked={formData.favorite_languages?.includes(lang)}
                                onChange={e => {
                                  const languages = formData.favorite_languages || [];
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      favorite_languages: [...languages, lang],
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      favorite_languages: languages.filter(l => l !== lang),
                                    }));
                                  }
                                }}
                                className="apple-auth-checkbox h-4 w-4 rounded-[7px] border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)]"
                              />
                              {lang}
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  </PreferenceSection>
                )}

                {/* Pet preferences */}
                {formData.favorite_hobbies?.includes('pet') && (
                  <PreferenceSection
                    title="Κατοικίδια"
                    icon={Cat}
                    sectionKey="pet"
                    isOpen={openPreferences.pet}
                    onToggle={() => togglePreference('pet')}
                    className=""
                  >
                    <>
                      <div className="text-sm">
                        <p className="apple-body-tracking mb-2 text-xs text-[var(--apple-secondary-label)]">
                          Τι κατοικίδια έχεις;
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {PET_TYPES.map(pet => (
                            <label
                              key={pet}
                              className="apple-body-tracking flex items-center gap-2 text-[var(--apple-secondary-label)]"
                            >
                              <input
                                type="checkbox"
                                checked={formData.pet_types?.includes(pet)}
                                onChange={e => {
                                  const pets = formData.pet_types || [];
                                  if (e.target.checked) {
                                    setFormData(prev => ({ ...prev, pet_types: [...pets, pet] }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      pet_types: pets.filter(p => p !== pet),
                                    }));
                                  }
                                }}
                                className="apple-auth-checkbox h-4 w-4 rounded-[7px] border-[var(--apple-separator)] bg-[var(--apple-tertiary-fill)]"
                              />
                              {pet}
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  </PreferenceSection>
                )}

                {/* Vape preferences */}
                {formData.favorite_hobbies?.includes('vape') && (
                  <PreferenceSection
                    title="Vape"
                    icon={Wind}
                    sectionKey="vape"
                    isOpen={openPreferences.vape}
                    onToggle={() => togglePreference('vape')}
                    className=""
                  >
                    <>
                      <div>
                        <Input
                          label="Αγαπημένη Συσκευή"
                          type="text"
                          name="vape_device"
                          value={formData.vape_device || ''}
                          onChange={handleChange}
                          placeholder="π.χ. Voopoo Drag, GeekVape..."
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <Input
                          label="Αγαπημένη Γεύση"
                          type="text"
                          name="vape_flavor"
                          value={formData.vape_flavor || ''}
                          onChange={handleChange}
                          placeholder="π.χ. Tobacco, Fruity, Dessert..."
                          className={inputClasses}
                        />
                      </div>
                    </>
                  </PreferenceSection>
                )}

                <p className="apple-body-tracking text-center text-xs text-[var(--apple-secondary-label)]">
                  Μπορείς να αλλάξεις αυτές τις επιλογές αργότερα από τις ρυθμίσεις.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-none space-y-4 border-t border-[var(--apple-separator-soft)] bg-transparent py-4">
          {/* Εμφάνιση CAPTCHA μόνο στο τελευταίο βήμα */}
          {currentStep === 3 && (
            <div className="flex min-h-[80px] w-full justify-center">
              {isCaptchaDisabled ? (
                <div className="apple-auth-section px-3 py-4 text-xs text-[var(--apple-secondary-label)]">
                  CAPTCHA is disabled in development mode.
                </div>
              ) : (
                <>
                  <CaptchaWidget
                    onTokenChange={token => {
                      setCaptchaToken(token);
                      if (token) setCaptchaError(null);
                    }}
                    resetSignal={captchaResetKey}
                  />
                  <FormErrorMessage message={captchaError ?? undefined} />
                </>
              )}
            </div>
          )}

          <div className="flex flex-row gap-3">
            {currentStep > 1 && (
              <Button type="button" variant="secondary" onClick={handleBack} disabled={loading}>
                <ArrowLeft className="h-5 w-5" />
                Πίσω
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              onClick={handleNext}
              disabled={loading || (!isCaptchaDisabled && currentStep === 3 && !captchaToken)}
              className="flex-[2] h-11 items-center justify-center gap-2"
            >
              {loading ? (
                'Εγγραφή...'
              ) : currentStep === 3 ? (
                <>
                  <Check className="h-5 w-5" />
                  Ολοκλήρωση Εγγραφής
                </>
              ) : (
                <>
                  Επόμενο
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>

          <div className="apple-body-tracking border-t border-[var(--apple-separator-soft)] pt-4 text-center text-sm text-[var(--apple-secondary-label)]">
            Έχεις ήδη λογαριασμό;{' '}
            <Link
              href={
                redirectParam
                  ? `/pages/auth/login?redirect=${encodeURIComponent(redirectParam)}`
                  : '/pages/auth/login'
              }
              className="font-semibold text-[var(--apple-system-blue)] transition hover:opacity-80"
            >
              Σύνδεση
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
