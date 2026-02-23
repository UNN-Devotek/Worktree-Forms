
import { prisma } from '../db.js';

export const EncryptionUtils = {
    /**
     * Encrypts text using Postgres pgcrypto pgp_sym_encrypt
     */
    encrypt: async (text: string, key: string): Promise<Buffer> => {
        const result = await prisma.$queryRaw<{'encrypted': Buffer}[]>`
            SELECT pgp_sym_encrypt(${text}, ${key}) as encrypted
        `;
        if (!result[0]?.encrypted) {
            throw new Error('Encryption produced no output');
        }
        return result[0].encrypted;
    },

    /**
     * Decrypts buffer using Postgres pgcrypto pgp_sym_decrypt
     */
    decrypt: async (encrypted: Buffer, key: string): Promise<string> => {
        const result = await prisma.$queryRaw<{'decrypted': string}[]>`
            SELECT pgp_sym_decrypt(${encrypted}, ${key}) as decrypted
        `;
        if (!result[0]?.decrypted) {
            throw new Error('Decryption produced no output');
        }
        return result[0].decrypted;
    }
};
