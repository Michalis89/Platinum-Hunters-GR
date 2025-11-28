'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, UserPlus, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
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
import { fetchSession } from '@/store/slices/authSlice';
import type { AppDispatch } from '@/store/store';

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

interface RegisterFormProps {
  readonly onSuccess?: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState<Partial<RegisterData>>({
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

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
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Σφάλμα εγγραφής');
      }

      setAlert({
        type: 'success',
        message:
          '✅ Επιτυχής εγγραφή! Έλεγξε το email σου για να επιβεβαιώσεις το λογαριασμό σου. Ανακατεύθυνση...',
      });

      // Fetch session to update Redux state
      await dispatch(fetchSession());

      // Redirect after short delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/pages/guides');
        }
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage =
        error instanceof Error ? error.message : '❌ Σφάλμα εγγραφής. Δοκιμάστε ξανά.';
      setAlert({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Progress indicator
  const progress = (currentStep / 3) * 100;

  return (
    <Card className="border border-slate-800/60 bg-slate-900/70 shadow-xl shadow-emerald-900/30 backdrop-blur-xl">
      <CardHeader className="border-slate-800/70">
        <CardTitle className="flex items-center justify-between text-white">
          <span className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-sky-400 to-blue-500 text-slate-950 shadow-lg shadow-emerald-400/30">
              <UserPlus className="h-5 w-5" />
            </div>
            Εγγραφή - Βήμα {currentStep} από 3
          </span>
          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-300">
            Profile setup
          </span>
        </CardTitle>
        {/* Progress Bar */}
        <div className="mt-4 h-2 w-full rounded-full bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {alert && <AlertMessage type={alert.type} message={alert.message} />}

        <AnimatePresence mode="wait">
          {/* Step 1: Account Info */}
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
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-2 flex-1 rounded-full bg-gray-700">
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
                      <ul className="mt-1 text-xs text-gray-400">
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
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-white"
                  >
                    {showPasswordConfirm ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <FormErrorMessage message={errors.password_confirm} />
              </div>

              <div>
                <label className="flex items-start gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    name="agree_to_terms"
                    checked={formData.agree_to_terms}
                    onChange={handleChange}
                    className="mt-1 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <span>
                    Αποδέχομαι τους{' '}
                    <Link
                      href="/pages/terms"
                      className="text-emerald-300 transition hover:text-emerald-200"
                    >
                      όρους χρήσης
                    </Link>{' '}
                    και την{' '}
                    <Link
                      href="/pages/privacy"
                      className="text-emerald-300 transition hover:text-emerald-200"
                    >
                      πολιτική απορρήτου
                    </Link>
                  </span>
                </label>
                <FormErrorMessage message={errors.agree_to_terms} />
              </div>
            </motion.div>
          )}

          {/* Step 2: Personal Info */}
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
                />
                <div className="mt-1 text-xs text-gray-400">{formData.bio?.length || 0} / 500</div>
                <FormErrorMessage message={errors.bio} />
              </div>
            </motion.div>
          )}

          {/* Step 3: Gaming Info */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <Input
                  label="PSN ID (προαιρετικό)"
                  type="text"
                  name="psn_id"
                  value={formData.psn_id}
                  onChange={handleChange}
                  placeholder="YourPSNID"
                  error={!!errors.psn_id}
                />
                <FormErrorMessage message={errors.psn_id} />
              </div>

              <div>
                <Select
                  label="Αγαπημένη Πλατφόρμα (προαιρετικό)"
                  options={['', ...PLATFORMS]}
                  value={formData.favorite_platform}
                  onChange={handleSelectChange('favorite_platform')}
                />
              </div>

              <div className="text-sm text-gray-300">
                <p className="mb-2">Αγαπημένα Genres (προαιρετικό):</p>
                <div className="grid grid-cols-2 gap-2">
                  {GENRES.map(genre => (
                    <label key={genre} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.favorite_genres?.includes(genre)}
                        onChange={e => {
                          const genres = formData.favorite_genres || [];
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, favorite_genres: [...genres, genre] }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              favorite_genres: genres.filter(g => g !== genre),
                            }));
                          }
                        }}
                        className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      {genre}
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-6 flex gap-4">
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
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 bg-gradient-to-r from-sky-500 via-blue-500 to-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/30 transition hover:shadow-emerald-300/40"
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

        {/* Login Link */}
        <div className="mt-4 text-center text-sm text-slate-400">
          Έχεις ήδη λογαριασμό;{' '}
          <Link
            href="/auth/login"
            className="font-medium text-emerald-300 transition hover:text-emerald-200"
          >
            Σύνδεση
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
