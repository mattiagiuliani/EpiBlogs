import { describe, expect, it } from 'vitest';
import Author from '../../backend/models/Author.js';
import Post from '../../backend/models/Post.js';

describe('mongoose models', () => {
    it('removes sensitive author fields when serialized', () => {
        const author = new Author({
            email: 'author@example.com',
            password: 'hashed-password',
            tokenGoogle: 'hidden-token',
            firstName: 'Mario'
        });

        const serialized = author.toJSON();

        expect(serialized.email).toBe('author@example.com');
        expect(serialized.password).toBeUndefined();
        expect(serialized.tokenGoogle).toBeUndefined();
    });

    it('validates post content and readTime constraints', async () => {
        const post = new Post({
            category: 'Tech',
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
});
