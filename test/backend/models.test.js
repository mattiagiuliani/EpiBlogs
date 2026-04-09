import { describe, expect, it } from 'vitest';
import AuthCode from '../../backend/models/AuthCode.js';
import Author from '../../backend/models/Author.js';
import Post from '../../backend/models/Post.js';
import RateLimitEntry from '../../backend/models/RateLimitEntry.js';

describe('mongoose models', () => {
    it('removes sensitive author fields when serialized', () => {
        const author = new Author({
            email: 'author@example.com',
            password: 'hashed-password',
            googleId: 'google-user-id',
            tokenGoogle: 'hidden-token',
            firstName: 'Mario'
        });

        const serialized = author.toJSON();

        expect(serialized.email).toBe('author@example.com');
        expect(serialized.password).toBeUndefined();
        expect(serialized.googleId).toBeUndefined();
        expect(serialized.tokenGoogle).toBeUndefined();
    });

    it('allows Google-authenticated authors without a local password', () => {
        const author = new Author({
            email: 'google@example.com',
            googleId: 'google-user-id',
            firstName: 'Giulia'
        });

        expect(author.validateSync()).toBeUndefined();
    });

    it('stores auth codes with an expiration date', () => {
        const authCode = new AuthCode({
            code: 'one-time-code',
            expiresAt: new Date(Date.now() + 60_000),
            payload: {
                author: {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'author@example.com'
                },
                token: 'jwt-token'
            }
        });

        expect(authCode.validateSync()).toBeUndefined();
    });

    it('stores shared rate limit entries with an expiration date', () => {
        const rateLimitEntry = new RateLimitEntry({
            key: 'login:203.0.113.10:1712484000000',
            count: 3,
            expiresAt: new Date(Date.now() + 60_000)
        });

        expect(rateLimitEntry.validateSync()).toBeUndefined();
    });

    it('validates post content and readTime constraints', async () => {
        const post = new Post({
            category: 'Tech',
            comments: [{
                author: '507f1f77bcf86cd799439011',
                comment: 'Looks good'
            }],
            title: 'Test title',
            cover: 'https://example.com/cover.jpg',
            readTime: {
                value: 0,
                unit: 'hours'
            },
            author: '507f1f77bcf86cd799439011',
            authorEmail: 'author@example.com',
            content: '   '
        });

        const validationError = post.validateSync();

        expect(validationError.errors['readTime.value'].message).toContain('less than minimum allowed value (1)');
        expect(validationError.errors['readTime.unit'].message).toContain('`hours` is not a valid enum value');
        expect(validationError.errors.content.message).toContain('required');
    });

    it('requires an author for each comment', () => {
        const post = new Post({
            category: 'Tech',
            title: 'Test title',
            cover: 'https://example.com/cover.jpg',
            readTime: {
                value: 5,
                unit: 'min'
            },
            author: '507f1f77bcf86cd799439011',
            authorEmail: 'author@example.com',
            content: 'Body',
            comments: [{
                comment: 'Missing owner'
            }]
        });

        const validationError = post.validateSync();

        expect(validationError.errors['comments.0.author'].message).toContain('required');
    });
});
