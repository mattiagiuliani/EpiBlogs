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

const { default: authentication } = await import('../../backend/middlewares/authentication.js');

const createResponse = () => ({
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis()
});

describe('authentication middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('allows public routes to pass without a token', async () => {
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
    });

    it('rejects protected routes without a bearer token', async () => {
        const request = {
            method: 'GET',
            path: '/me',
            headers: {}
        };
        const response = createResponse();
        const next = vi.fn();

        await authentication(request, response, next);

        expect(response.status).toHaveBeenCalledWith(401);
        expect(response.send).toHaveBeenCalledWith({ message: 'Token missing or invalid' });
        expect(next).not.toHaveBeenCalled();
    });

    it('attaches the author and token on valid protected requests', async () => {
        const author = { _id: '507f1f77bcf86cd799439011', email: 'author@example.com' };
        verifyAccessTokenMock.mockReturnValue({ authorId: author._id });
        findByIdMock.mockReturnValue({
            lean: vi.fn().mockResolvedValue(author)
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
        expect(request.author).toEqual(author);
        expect(request.token).toBe('valid-token');
        expect(next).toHaveBeenCalledOnce();
    });

    it('rejects invalid tokens', async () => {
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

        expect(response.status).toHaveBeenCalledWith(401);
        expect(response.send).toHaveBeenCalledWith({ message: 'Token not valid' });
        expect(next).not.toHaveBeenCalled();
    });
});
