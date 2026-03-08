import { describe, it, expect } from 'vitest';
import { EncryptionUtils } from '../../utils/encryption.js';

/**
 * EncryptionUtils — AES-256-GCM encrypt/decrypt roundtrip.
 * Pure crypto: no DynamoDB, no mocks needed.
 */
describe('EncryptionUtils', () => {
  const KEY = 'test-secret-key-for-aes-256-gcm!!';

  it('[P0] encrypt + decrypt produces original plaintext', async () => {
    const plaintext = 'Hello, World!';
    const cipherBuf = await EncryptionUtils.encrypt(plaintext, KEY);
    const result = await EncryptionUtils.decrypt(cipherBuf, KEY);
    expect(result).toBe(plaintext);
  });

  it('[P0] encrypt returns a Buffer (IV + tag + ciphertext)', async () => {
    const buf = await EncryptionUtils.encrypt('test', KEY);
    // IV (16) + tag (16) + at least 1 byte ciphertext
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(32);
  });

  it('[P0] ciphertext is different each call (random IV)', async () => {
    const plaintext = 'same input';
    const a = await EncryptionUtils.encrypt(plaintext, KEY);
    const b = await EncryptionUtils.encrypt(plaintext, KEY);
    expect(a.equals(b)).toBe(false);
  });

  it('[P0] wrong key causes decryption to throw', async () => {
    const cipherBuf = await EncryptionUtils.encrypt('secret', KEY);
    await expect(EncryptionUtils.decrypt(cipherBuf, 'wrong-key')).rejects.toThrow();
  });

  it('[P1] encrypts and decrypts empty string', async () => {
    const cipherBuf = await EncryptionUtils.encrypt('', KEY);
    const result = await EncryptionUtils.decrypt(cipherBuf, KEY);
    expect(result).toBe('');
  });

  it('[P1] encrypts and decrypts a long multiline string', async () => {
    const long = 'a'.repeat(10000) + '\n' + 'Unicode: 你好🌍';
    const cipherBuf = await EncryptionUtils.encrypt(long, KEY);
    const result = await EncryptionUtils.decrypt(cipherBuf, KEY);
    expect(result).toBe(long);
  });

  it('[P1] tampered ciphertext fails authentication tag check', async () => {
    const cipherBuf = await EncryptionUtils.encrypt('tamper me', KEY);
    // Flip the last byte of the ciphertext portion
    const tampered = Buffer.from(cipherBuf);
    tampered[tampered.length - 1] ^= 0xff;
    await expect(EncryptionUtils.decrypt(tampered, KEY)).rejects.toThrow();
  });
});
