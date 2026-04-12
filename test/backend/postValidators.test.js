import { describe, expect, it, vi } from 'vitest';
import { validatePostBody } from '../../backend/routes/posts/validators.js';

const createResponse = () => ({
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis()
});

describe('post validators', () => {
    it('accepts a valid create payload', () => {
        const response = createResponse();

        expect(validatePostBody({
            category: 'Tech',
            title: 'Valid title',
            cover: 'https://example.com/cover.jpg',
            content: 'Body',
            readTime: {
                value: 5,
                unit: 'min'
            }
        }, response)).toBe(true);
        expect(response.status).not.toHaveBeenCalled();
    });

    it('rejects invalid readTime data', () => {
        const response = createResponse();

        expect(validatePostBody({
            title: 'Invalid',
            readTime: {
                value: 0,
                unit: 'hours'
            }
        }, response, { partial: true })).toBe(false);
        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.send).toHaveBeenCalledWith({
            message: 'readTime must include an integer value >= 1 and unit "min"'
        });
    });

    it('rejects missing required fields on create', () => {
        const response = createResponse();

        expect(validatePostBody({}, response)).toBe(false);
        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.send).toHaveBeenCalledWith({
            message: 'Category is required'
        });
    });
});
