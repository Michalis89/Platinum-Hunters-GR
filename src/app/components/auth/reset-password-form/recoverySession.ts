import { supabase } from '@/lib/supabase-client';

export async function establishRecoverySessionFromUrl(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  const hashParams = new URLSearchParams(hash);
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  const hashType = hashParams.get('type');
  if (accessToken && refreshToken && (!hashType || hashType === 'recovery')) {
    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!setSessionError) return true;
  }

  const queryParams = new URLSearchParams(window.location.search);
  const code = queryParams.get('code');
  if (code) {
    const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!codeError) return true;
  }

  const tokenHash = queryParams.get('token_hash');
  const type = queryParams.get('type');
  if (tokenHash && (!type || type === 'recovery')) {
    const { error: otpError } = await supabase.auth.verifyOtp({
      type: 'recovery',
      token_hash: tokenHash,
    });
    if (!otpError) return true;
  }

  return false;
}

export function hasRecoveryParamsInUrl() {
  if (typeof window === 'undefined') return false;

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  const hashParams = new URLSearchParams(hash);
  const hasHashTokens = !!(hashParams.get('access_token') && hashParams.get('refresh_token'));
  const hashType = hashParams.get('type');

  const queryParams = new URLSearchParams(window.location.search);
  const hasCode = !!queryParams.get('code');
  const hasTokenHash = !!queryParams.get('token_hash');
  const queryType = queryParams.get('type');

  const isRecoveryHash = hasHashTokens && (!hashType || hashType === 'recovery');
  const isRecoveryQuery = hasCode || (hasTokenHash && (!queryType || queryType === 'recovery'));

  return isRecoveryHash || isRecoveryQuery;
}

export function clearRecoveryParamsFromUrl() {
  if (typeof window === 'undefined') return;
  window.history.replaceState({}, document.title, window.location.pathname);
}

export function isSessionError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('auth session missing') ||
    normalized.includes('invalid session') ||
    normalized.includes('jwt') ||
    normalized.includes('session expired')
  );
}

