const AES_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
export const DIARY_KEY_ITERATIONS = 250_000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function assertWebCryptoAvailable() {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Crypto API is unavailable in this environment');
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const normalized = base64
    .trim()
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const remainder = normalized.length % 4;
  const padded = remainder === 0 ? normalized : `${normalized}${'='.repeat(4 - remainder)}`;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function deriveDiaryKeyFromPassphrase(
  passphrase: string,
  saltB64: string,
): Promise<CryptoKey> {
  assertWebCryptoAvailable();
  const decodedSalt = base64ToBytes(saltB64);
  const salt = new Uint8Array(decodedSalt.length);
  salt.set(decodedSalt);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: DIARY_KEY_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: AES_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptDiaryField(
  plaintext: string,
  key: CryptoKey,
  aad?: string,
): Promise<{ cipherTextB64: string; ivB64: string }> {
  assertWebCryptoAvailable();

  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const payload = encoder.encode(plaintext);
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: AES_ALGORITHM,
      iv,
      additionalData: aad ? encoder.encode(aad) : undefined,
    },
    key,
    payload,
  );

  return {
    cipherTextB64: bytesToBase64(new Uint8Array(encryptedBuffer)),
    ivB64: bytesToBase64(iv),
  };
}

export async function decryptDiaryField(
  cipherTextB64: string,
  ivB64: string,
  key: CryptoKey,
  aad?: string,
): Promise<string> {
  assertWebCryptoAvailable();

  const encryptedBytes = base64ToBytes(cipherTextB64);
  const iv = new Uint8Array(base64ToBytes(ivB64));
  const encryptedPayload = new Uint8Array(encryptedBytes.length);
  encryptedPayload.set(encryptedBytes);
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: AES_ALGORITHM,
      iv,
      additionalData: aad ? encoder.encode(aad) : undefined,
    },
    key,
    encryptedPayload,
  );

  return decoder.decode(decryptedBuffer);
}

export function generateDiarySalt(): string {
  assertWebCryptoAvailable();
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(16)));
}
