import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export const EncryptionUtils = {
  /**
   * Encrypts text using AES-256-GCM (replaces Postgres pgcrypto)
   */
  encrypt: async (text: string, key: string): Promise<Buffer> => {
    const derivedKey = crypto.createHash('sha256').update(key).digest();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Return iv + tag + ciphertext as a single buffer
    return Buffer.concat([iv, tag, encrypted]);
  },

  /**
   * Decrypts buffer using AES-256-GCM (replaces Postgres pgcrypto)
   */
  decrypt: async (encrypted: Buffer, key: string): Promise<string> => {
    const derivedKey = crypto.createHash('sha256').update(key).digest();
    const iv = encrypted.subarray(0, IV_LENGTH);
    const tag = encrypted.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = encrypted.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  },
};
