import { describe, expect, it, vi } from 'vitest';
import { isOwnedByAuthenticatedAuthor, sendForbiddenOwnershipError } from '../../backend/utils/ownership.js';

describe('ownership helpers', () => {
    it('matches resources owned by the authenticated author', () => {
        const request = {
            author: {
                _id: '507f1f77bcf86cd799439011'
            }
        };

        expect(isOwnedByAuthenticatedAuthor(request, '507f1f77bcf86cd799439011')).toBe(true);
        expect(isOwnedByAuthenticatedAuthor(request, '507f1f77bcf86cd799439012')).toBe(false);
    });

    it('normalizes ObjectId-like owner values before comparison', () => {
        const request = {
            author: {
                _id: '507f1f77bcf86cd799439011'
            }
        };

        expect(isOwnedByAuthenticatedAuthor(request, {
            toString: () => '507f1f77bcf86cd799439011'
        })).toBe(true);
    });

    it('sends a 403 ownership error', () => {
        const response = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn()
        };

        sendForbiddenOwnershipError(response, 'Forbidden');

        expect(response.status).toHaveBeenCalledWith(403);
        expect(response.send).toHaveBeenCalledWith({ message: 'Forbidden' });
    });
});
