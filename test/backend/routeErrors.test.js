import { describe, expect, it, vi } from 'vitest';
import { sendDuplicateKeyError, sendValidationError } from '../../backend/utils/routeErrors.js';

const createResponse = () => {
    const response = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis()
    };

    return response;
};

describe('route error helpers', () => {
    it('formats mongoose validation errors', () => {
        const response = createResponse();
        const error = {
            name: 'ValidationError',
            errors: {
                email: { path: 'email', message: 'Email is required' },
                password: { path: 'password', message: 'Password is required' }
            }
        };

        const handled = sendValidationError(error, response);

        expect(handled).toBe(true);
        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.send).toHaveBeenCalledWith({
            message: 'Validation failed',
            errors: [
                { field: 'email', message: 'Email is required' },
                { field: 'password', message: 'Password is required' }
            ]
        });
    });

    it('formats duplicate key errors', () => {
        const response = createResponse();
        const error = {
            code: 11000,
            keyPattern: { email: 1 }
        };

        const handled = sendDuplicateKeyError(error, response);

        expect(handled).toBe(true);
        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.send).toHaveBeenCalledWith({
            message: 'Duplicate value',
            errors: [
                { field: 'email', message: 'email already exists' }
            ]
        });
    });
});
