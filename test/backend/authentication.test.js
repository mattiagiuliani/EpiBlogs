import { beforeEach, describe, expect, it, vi } from 'vitest';

const findByIdMock = vi.fn();
const verifyAccessTokenMock = vi.fn();

vi.mock('../../backend/models/Author.js', () => ({
    default: {
        findById: findByIdMock
    }
}));

vi.mock('../../backend/utils/jwt.js', () => ({
    verifyAccessToken: verifyAccessTokenMock
}));

const {
    default: authentication,
    requireAuthentication
} = await import('../../backend/middlewares/authentication.js');

const createResponse = () => ({
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis()
});

describe('authentication middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('marks requests as missing auth when no token is present', async () => {
        const request = {
            method: 'POST',
            path: '/login',
            headers: {}
        };
        const response = createResponse();
        const next = vi.fn();

        await authentication(request, response, next);

        expect(next).toHaveBeenCalledOnce();
        expect(response.status).not.toHaveBeenCalled();
        expect(request.author).toBeNull();
        expect(request.auth).toEqual({ status: 'missing' });
    });

    it('attaches the author and token on valid protected requests', async () => {
        const author = { _id: '507f1f77bcf86cd799439011', email: 'AUTHOR@example.com ' };
        verifyAccessTokenMock.mockReturnValue({ authorId: author._id });
        findByIdMock.mockReturnValue({
            select: vi.fn().mockResolvedValue(author)
        });

        const request = {
            method: 'GET',
            path: '/me/',
            headers: {
                authorization: 'Bearer valid-token'
            }
        };
        const response = createResponse();
        const next = vi.fn();

        await authentication(request, response, next);

        expect(verifyAccessTokenMock).toHaveBeenCalledWith('valid-token');
        expect(findByIdMock).toHaveBeenCalledWith(author._id);
        expect(request.author).toEqual({
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com'
        });
        expect(request.auth).toEqual({ status: 'authenticated' });
        expect(request.token).toBe('valid-token');
        expect(next).toHaveBeenCalledOnce();
    });

    it('prefers the auth cookie over the bearer token', async () => {
        verifyAccessTokenMock.mockReturnValue({ authorId: '507f1f77bcf86cd799439011' });
        findByIdMock.mockReturnValue({
            select: vi.fn().mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                email: 'author@example.com'
            })
        });

        const request = {
            headers: {
                authorization: 'Bearer bearer-token',
                cookie: 'epiblogs.accessToken=cookie-token'
            }
        };

        await authentication(request, createResponse(), vi.fn());

        expect(verifyAccessTokenMock).toHaveBeenCalledWith('cookie-token');
        expect(request.token).toBe('cookie-token');
    });

    it('records invalid tokens without blocking optional auth middleware', async () => {
        verifyAccessTokenMock.mockImplementation(() => {
            throw new Error('bad token');
        });

        const request = {
            method: 'GET',
            path: '/api/v1/posts',
            headers: {
                authorization: 'Bearer bad-token'
            }
        };
        const response = createResponse();
        const next = vi.fn();

        await authentication(request, response, next);

        expect(request.author).toBeNull();
        expect(request.auth).toEqual({ status: 'invalid' });
        expect(next).toHaveBeenCalledOnce();
    });

    it('rejects protected routes without a token', async () => {
        const request = {
            method: 'GET',
            path: '/me',
            headers: {}
        };
        const response = createResponse();
        const next = vi.fn();

        await requireAuthentication(request, response, next);

        expect(response.status).toHaveBeenCalledWith(401);
        expect(response.send).toHaveBeenCalledWith({ message: 'Token missing or invalid' });
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects protected routes with invalid tokens', async () => {
        verifyAccessTokenMock.mockImplementation(() => {
            throw new Error('bad token');
        });

        const request = {
            method: 'GET',
            path: '/me',
            headers: {
                authorization: 'Bearer bad-token'
            }
        };
        const response = createResponse();
        const next = vi.fn();

        await requireAuthentication(request, response, next);

        expect(response.status).toHaveBeenCalledWith(401);
        expect(response.send).toHaveBeenCalledWith({ message: 'Token not valid' });
        expect(next).not.toHaveBeenCalled();
    });
});
