import { describe, expect, it } from 'vitest';
import { pickAuthorInput } from '../../backend/utils/authorData.js';
import { pickPostInput } from '../../backend/utils/postData.js';

describe('input sanitizers', () => {
    it('keeps only allowed author fields and normalizes email', () => {
        expect(pickAuthorInput({
            email: ' Test@Example.com ',
            firstName: 'Mario',
            googleId: 'google-user-id',
            password: 'secret123',
            tokenGoogle: 'provider-token'
        })).toEqual({
            email: 'test@example.com',
            firstName: 'Mario',
            password: 'secret123'
        });
    });

    it('keeps only allowed post fields', () => {
        expect(pickPostInput({
            author: '507f1f77bcf86cd799439011',
            authorEmail: 'spoofed@example.com',
            category: 'Tech',
            comments: [{ comment: 'Injected' }],
            content: 'Hello world',
            title: 'Safe title'
        })).toEqual({
            author: '507f1f77bcf86cd799439011',
            category: 'Tech',
            content: 'Hello world',
            title: 'Safe title'
        });
    });
});
