/**
 * Auth Redux Slice
 * PH-30: User Authentication System
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AuthSession } from '@/types/auth';
import type { User } from '@/types/user';
import { supabase } from '@/lib/supabase-client';

/**
 * Initial state
 */
const initialState: AuthSession = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

/**
 * Thunk: Fetch current session
 */
export const fetchSession = createAsyncThunk('auth/fetchSession', async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  if (!session) return null;

  // Fetch full user profile from public.users
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profileError) throw profileError;

  return userProfile as User;
});

/**
 * Thunk: Login
 */
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Fetch full user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw profileError;

    // Update last_login (using type assertion due to Supabase RPC typing limitations)
    await supabase.rpc('update_user_last_login', { user_id: data.user.id } as never);

    return userProfile as User;
  },
);

/**
 * Thunk: Logout
 */
export const logout = createAsyncThunk('auth/logout', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
});

/**
 * Thunk: Update user profile
 */
export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates as never)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },
);

/**
 * Auth Slice
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    // Fetch Session
    builder
      .addCase(fetchSession.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchSession.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = action.error.message || 'Σφάλμα φόρτωσης session';
      });

    // Login
    builder
      .addCase(login.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = action.error.message || 'Σφάλμα σύνδεσης';
      });

    // Logout
    builder
      .addCase(logout.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, state => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Σφάλμα αποσύνδεσης';
      });

    // Update Profile
    builder
      .addCase(updateUserProfile.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Σφάλμα ενημέρωσης προφίλ';
      });
  },
});

// Export actions
export const { setUser, setLoading, setError, clearError } = authSlice.actions;

// Export reducer
export default authSlice.reducer;

// Selectors
export const selectAuth = (state: { auth: AuthSession }) => state.auth;
export const selectUser = (state: { auth: AuthSession }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthSession }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthSession }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthSession }) => state.auth.error;

// Computed/derived selectors for common role checks
import { createSelector } from '@reduxjs/toolkit';
import { getUserRoles, hasAnyRole } from '@/lib/roles';

export const selectUserRoles = (state: { auth: AuthSession }) => {
  const user = state.auth.user;
  return user ? getUserRoles(user) : [];
};

export const selectCanQuickAdd = (state: { auth: AuthSession }) => {
  const user = state.auth.user;
  return !!user && hasAnyRole(user, ['admin', 'author', 'reviewer', 'owner']);
};

export const selectCanAccessAdminPanel = (state: { auth: AuthSession }) => {
  const user = state.auth.user;
  return !!user && hasAnyRole(user, ['admin', 'moderator', 'owner']);
};

export const selectIsAdmin = (state: { auth: AuthSession }) => {
  const user = state.auth.user;
  return !!user && hasAnyRole(user, ['admin', 'owner']);
};

export const selectIsAdminOrModerator = (state: { auth: AuthSession }) => {
  const user = state.auth.user;
  return !!user && hasAnyRole(user, ['admin', 'owner', 'moderator']);
};

export const selectCanEditArticles = (state: { auth: AuthSession }) => {
  const user = state.auth.user;
  return !!user && hasAnyRole(user, ['admin', 'author', 'reviewer', 'owner']);
};

// Factory selector: Check if user is author of specific item
export const selectIsAuthorOf = (authorId: string | null | undefined) => (state: { auth: AuthSession }) => {
  const user = state.auth.user;
  return Boolean(user && authorId && user.id === authorId);
};

// Combined selector for Navbar - reduces re-renders by subscribing once
export const selectNavbarAuth = createSelector(
  [selectIsAuthenticated, selectIsLoading, selectUser, selectCanQuickAdd, selectCanAccessAdminPanel],
  (isAuthenticated, isLoading, user, canQuickAdd, canAccessAdminPanel) => ({
    isAuthenticated,
    isLoading,
    user,
    canQuickAdd,
    canAccessAdminPanel,
  }),
);
