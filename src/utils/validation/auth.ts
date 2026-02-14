/**
 * Authentication Validation Utilities
 * PH-30: User Authentication System
 */

/**
 * Email validation
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Το email είναι υποχρεωτικό' };
  }

  if (email.length > 255) {
    return { isValid: false, error: 'Το email δεν μπορεί να υπερβαίνει τους 255 χαρακτήρες' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Μη έγκυρη μορφή email' };
  }

  return { isValid: true };
}

/**
 * Username validation
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username || username.trim() === '') {
    return { isValid: false, error: 'Το username είναι υποχρεωτικό' };
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Το username πρέπει να έχει τουλάχιστον 3 χαρακτήρες' };
  }

  if (username.length > 20) {
    return { isValid: false, error: 'Το username δεν μπορεί να υπερβαίνει τους 20 χαρακτήρες' };
  }

  // Must start with letter
  if (!/^[a-zA-Z]/.test(username)) {
    return { isValid: false, error: 'Το username πρέπει να αρχίζει με γράμμα' };
  }

  // Alphanumeric + underscore only
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      isValid: false,
      error: 'Το username μπορεί να περιέχει μόνο γράμματα, αριθμούς και κάτω παύλα (_)',
    };
  }

  return { isValid: true };
}

/**
 * Password validation
 */
export interface PasswordStrength {
  score: number; // 0-4
  label: 'Πολύ Αδύναμο' | 'Αδύναμο' | 'Μέτριο' | 'Δυνατό' | 'Πολύ Δυνατό';
  color: string;
  errors: string[];
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Ο κωδικός είναι υποχρεωτικός' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Ο κωδικός δεν μπορεί να υπερβαίνει τους 128 χαρακτήρες' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα πεζό γράμμα' };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα κεφαλαίο γράμμα',
    };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Ο κωδικός πρέπει να περιέχει τουλάχιστον έναν αριθμό' };
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return {
      isValid: false,
      error: 'Ο κωδικός πρέπει να περιέχει τουλάχιστον έναν ειδικό χαρακτήρα',
    };
  }

  return { isValid: true };
}

/**
 * Calculate password strength
 */
export function getPasswordStrength(password: string): PasswordStrength {
  const errors: string[] = [];
  let score = 0;

  if (!password) {
    return {
      score: 0,
      label: 'Πολύ Αδύναμο',
      color: '#dc2626',
      errors: ['Εισάγετε κωδικό'],
    };
  }

  // Length check
  if (password.length >= 8) score++;
  else errors.push('Τουλάχιστον 8 χαρακτήρες');

  if (password.length >= 12) score++;

  // Character type checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    errors.push('Πεζά και κεφαλαία γράμματα');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    errors.push('Τουλάχιστον έναν αριθμό');
  }

  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score++;
  } else {
    errors.push('Τουλάχιστον έναν ειδικό χαρακτήρα');
  }

  // Avoid common patterns
  if (/(012|123|234|345|456|567|678|789|890)/.test(password)) score--;
  if (
    /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(
      password,
    )
  )
    score--;
  if (/(.)\1{2,}/.test(password)) score--; // Repeated characters

  // Clamp score between 0-4
  score = Math.max(0, Math.min(4, score));

  const strengthMap: Record<number, { label: PasswordStrength['label']; color: string }> = {
    0: { label: 'Πολύ Αδύναμο', color: '#dc2626' },
    1: { label: 'Αδύναμο', color: '#f97316' },
    2: { label: 'Μέτριο', color: '#eab308' },
    3: { label: 'Δυνατό', color: '#22c55e' },
    4: { label: 'Πολύ Δυνατό', color: '#16a34a' },
  };

  return {
    score,
    ...strengthMap[score],
    errors,
  };
}

/**
 * Confirm password match
 */
export function validatePasswordConfirm(
  password: string,
  confirmPassword: string,
): { isValid: boolean; error?: string } {
  if (!confirmPassword) {
    return { isValid: false, error: 'Επιβεβαιώστε τον κωδικό' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Οι κωδικοί δεν ταιριάζουν' };
  }

  return { isValid: true };
}

/**
 * Full name validation
 */
export function validateFullName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Το ονοματεπώνυμο είναι υποχρεωτικό' };
  }

  if (name.length < 2) {
    return { isValid: false, error: 'Το ονοματεπώνυμο πρέπει να έχει τουλάχιστον 2 χαρακτήρες' };
  }

  if (name.length > 100) {
    return {
      isValid: false,
      error: 'Το ονοματεπώνυμο δεν μπορεί να υπερβαίνει τους 100 χαρακτήρες',
    };
  }

  // Letters, spaces, hyphens only
  if (!/^[a-zA-ZΑ-Ωα-ωάέήίόύώΆΈΉΊΌΎΏ\s-]+$/.test(name)) {
    return {
      isValid: false,
      error: 'Το ονοματεπώνυμο μπορεί να περιέχει μόνο γράμματα, κενά και παύλες',
    };
  }

  return { isValid: true };
}

/**
 * Date of birth validation (must be at least 13 years old)
 */
export function validateDateOfBirth(dob: string): { isValid: boolean; error?: string } {
  if (!dob) {
    return { isValid: false, error: 'Η ημερομηνία γέννησης είναι υποχρεωτική' };
  }

  const date = new Date(dob);
  const today = new Date();

  // Check if valid date
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Μη έγκυρη ημερομηνία' };
  }

  // Check if in future
  if (date > today) {
    return { isValid: false, error: 'Η ημερομηνία γέννησης δεν μπορεί να είναι στο μέλλον' };
  }

  // Check minimum age (13 years)
  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();

  const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

  if (actualAge < 13) {
    return { isValid: false, error: 'Πρέπει να είσαι τουλάχιστον 13 ετών για να εγγραφείς' };
  }

  return { isValid: true };
}

/**
 * PSN ID validation
 */
export function validatePSNId(psnId: string): { isValid: boolean; error?: string } {
  if (!psnId || psnId.trim() === '') {
    return { isValid: true }; // Optional field
  }

  if (psnId.length < 3) {
    return { isValid: false, error: 'Το PSN ID πρέπει να έχει τουλάχιστον 3 χαρακτήρες' };
  }

  if (psnId.length > 16) {
    return { isValid: false, error: 'Το PSN ID δεν μπορεί να υπερβαίνει τους 16 χαρακτήρες' };
  }

  // Alphanumeric, underscore, hyphen only
  if (!/^[a-zA-Z0-9_-]+$/.test(psnId)) {
    return {
      isValid: false,
      error: 'Το PSN ID μπορεί να περιέχει μόνο γράμματα, αριθμούς, κάτω παύλα και παύλα',
    };
  }

  return { isValid: true };
}

/**
 * Bio validation
 */
export function validateBio(bio: string): { isValid: boolean; error?: string } {
  if (!bio || bio.trim() === '') {
    return { isValid: true }; // Optional field
  }

  if (bio.length > 500) {
    return { isValid: false, error: 'Το bio δεν μπορεί να υπερβαίνει τους 500 χαρακτήρες' };
  }

  return { isValid: true };
}
