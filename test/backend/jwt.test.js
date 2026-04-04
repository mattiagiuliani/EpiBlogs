import { afterEach, describe, expect, it } from 'vitest';
import { generateAccessToken, verifyAccessToken } from '../../backend/utils/jwt.js';

describe('jwt helpers', () => {
    afterEach(() => {
        delete process.env.JWT_SECRET_KEY;
    });

    it('generates and verifies a token for an author', () => {
        process.env.JWT_SECRET_KEY = 'test-secret';

        const token = generateAccessToken({
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com'
        });

        const payload = verifyAccessToken(token);

        expect(payload.authorId).toBe('507f1f77bcf86cd799439011');
        expect(payload.email).toBe('author@example.com');
    });

    it('throws when the JWT secret is not configured', () => {
        expect(() => generateAccessToken({
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com'
        })).toThrow('JWT_SECRET_KEY is not configured');
    });
});
