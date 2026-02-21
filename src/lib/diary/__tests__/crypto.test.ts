import { webcrypto } from 'node:crypto';
import { TextDecoder, TextEncoder } from 'util';

let decryptDiaryField: typeof import('@/lib/diary/crypto').decryptDiaryField;
let deriveDiaryKeyFromPassphrase: typeof import('@/lib/diary/crypto').deriveDiaryKeyFromPassphrase;
let encryptDiaryField: typeof import('@/lib/diary/crypto').encryptDiaryField;
let generateDiarySalt: typeof import('@/lib/diary/crypto').generateDiarySalt;

beforeAll(() => {
  Object.defineProperty(globalThis, 'TextEncoder', {
    value: TextEncoder,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'TextDecoder', {
    value: TextDecoder,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
});

beforeAll(async () => {
  const cryptoModule = await import('@/lib/diary/crypto');
  decryptDiaryField = cryptoModule.decryptDiaryField;
  deriveDiaryKeyFromPassphrase = cryptoModule.deriveDiaryKeyFromPassphrase;
  encryptDiaryField = cryptoModule.encryptDiaryField;
  generateDiarySalt = cryptoModule.generateDiarySalt;
});

describe('diary crypto', () => {
  it('encrypts and decrypts a field roundtrip', async () => {
    const key = await deriveDiaryKeyFromPassphrase('diary-passphrase', generateDiarySalt());
    const plaintext = 'Quiet thoughts remain private.';
    const aad = 'user-1:entry-1:content';

    const encrypted = await encryptDiaryField(plaintext, key, aad);
    const decrypted = await decryptDiaryField(encrypted.cipherTextB64, encrypted.ivB64, key, aad);

    expect(decrypted).toBe(plaintext);
  });

  it('uses unique IV values per encryption', async () => {
    const key = await deriveDiaryKeyFromPassphrase('diary-passphrase', generateDiarySalt());
    const plaintext = 'Same content should have unique ciphertext.';
    const aad = 'user-2:entry-2:title';

    const first = await encryptDiaryField(plaintext, key, aad);
    const second = await encryptDiaryField(plaintext, key, aad);

    expect(first.ivB64).not.toBe(second.ivB64);
    expect(first.cipherTextB64).not.toBe(second.cipherTextB64);
  });

  it('fails decryption for tampered ciphertext', async () => {
    const key = await deriveDiaryKeyFromPassphrase('diary-passphrase', generateDiarySalt());
    const aad = 'user-3:entry-3:content';
    const encrypted = await encryptDiaryField('Tamper detection check', key, aad);
    const tamperedCipher = encrypted.cipherTextB64.slice(0, -2) + 'AA';

    await expect(decryptDiaryField(tamperedCipher, encrypted.ivB64, key, aad)).rejects.toThrow();
  });

  it('fails decryption when AAD does not match', async () => {
    const key = await deriveDiaryKeyFromPassphrase('diary-passphrase', generateDiarySalt());
    const encrypted = await encryptDiaryField('AAD guard check', key, 'user-4:entry-4:content');

    await expect(
      decryptDiaryField(encrypted.cipherTextB64, encrypted.ivB64, key, 'user-4:entry-5:content'),
    ).rejects.toThrow();
  });

  it('decrypts when base64 payloads are url-safe and unpadded', async () => {
    const key = await deriveDiaryKeyFromPassphrase('diary-passphrase', generateDiarySalt());
    const aad = 'user-5:entry-5:title';
    const plaintext = 'URL-safe base64 compatibility';

    const encrypted = await encryptDiaryField(plaintext, key, aad);
    const toUrlSafeUnpadded = (value: string) =>
      value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

    const decrypted = await decryptDiaryField(
      toUrlSafeUnpadded(encrypted.cipherTextB64),
      toUrlSafeUnpadded(encrypted.ivB64),
      key,
      aad,
    );

    expect(decrypted).toBe(plaintext);
  });
});
