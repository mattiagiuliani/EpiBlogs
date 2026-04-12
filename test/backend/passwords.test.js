import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../backend/utils/passwords.js';

describe('password helpers', () => {
    it('hashes a password and verifies it correctly', async () => {
        const plainPassword = 'supersecret123';
        const hash = await hashPassword(plainPassword);

        expect(hash).not.toBe(plainPassword);
        await expect(verifyPassword(plainPassword, hash)).resolves.toBe(true);
        await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
    });

    it('returns false when the stored hash is missing', async () => {
        await expect(verifyPassword('password', '')).resolves.toBe(false);
        await expect(verifyPassword('password', null)).resolves.toBe(false);
    });
});
