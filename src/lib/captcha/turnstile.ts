const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

type TurnstileVerifyResponse = {
  success: boolean;
  'error-codes'?: string[];
};

export async function verifyCaptchaToken(token?: string) {
  if (!token) {
    return { success: false, errors: ['missing-token'] };
  }

  if (!TURNSTILE_SECRET_KEY) {
    throw new Error('Missing TURNSTILE_SECRET_KEY environment variable');
  }

  const params = new URLSearchParams({
    secret: TURNSTILE_SECRET_KEY,
    response: token,
  });

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    console.error('Turnstile verification failed', await response.text());
    return { success: false, errors: ['verification-failed'] };
  }

  const payload = (await response.json()) as TurnstileVerifyResponse;
  return { success: payload.success, errors: payload['error-codes'] ?? [] };
}
