/**
 * Authentication Types
 * PH-30: User Authentication System
 */

import { User } from './user';

/**
 * Authentication Session
 */
export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Login Credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

/**
 * Registration Data (Step 1: Basic Info)
 */
export interface RegisterDataStep1 {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  agree_to_terms: boolean;
}

/**
 * Registration Data (Step 2: Personal Info)
 */
export interface RegisterDataStep2 {
  full_name: string;
  date_of_birth: string; // YYYY-MM-DD
  country: string;
  bio?: string;
  avatar?: File; // Optional avatar upload
}

/**
 * Registration Data (Step 3: Gaming Info)
 */
export interface RegisterDataStep3 {
  psn_id?: string;
  xbox_gamertag?: string;
  steam_id?: string;
  nintendo_id?: string;
  favorite_platform?: string;
  favorite_genres?: string[];
  gaming_since?: number;
}

/**
 * Complete Registration Data
 */
export interface RegisterData
  extends RegisterDataStep1,
    RegisterDataStep2,
    RegisterDataStep3 {}

/**
 * Registration Response
 */
export interface RegisterResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

/**
 * Login Response
 */
export interface LoginResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

/**
 * Password Reset Request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password Reset Confirmation
 */
export interface PasswordResetConfirm {
  token: string;
  password: string;
  password_confirm: string;
}

/**
 * Password Change (authenticated user)
 */
export interface PasswordChange {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

/**
 * Email Verification
 */
export interface EmailVerification {
  token: string;
  email: string;
}

/**
 * Auth Error Response
 */
export interface AuthError {
  error: string;
  message: string;
  status: number;
}

/**
 * Auth API Response (generic)
 */
export type AuthApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: AuthError;
    };
