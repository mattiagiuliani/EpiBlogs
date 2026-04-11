import express from '../../backend/node_modules/express/index.js';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findOneAndUpdateRateLimitMock } = vi.hoisted(() => ({
    findOneAndUpdateRateLimitMock: vi.fn()
}));

const createMock = vi.fn();
const consumeAuthCodeMock = vi.fn();
const createAuthCodeMock = vi.fn();
const findOneMock = vi.fn();
const hashPasswordMock = vi.fn();
const verifyPasswordMock = vi.fn();
const generateAccessTokenMock = vi.fn();

vi.mock('../../backend/models/Author.js', () => ({
    default: {
        create: createMock,
        findOne: findOneMock
    }
}));

vi.mock('../../backend/utils/passwords.js', () => ({
    hashPassword: hashPasswordMock,
    verifyPassword: verifyPasswordMock
}));

vi.mock('../../backend/utils/jwt.js', () => ({
    generateAccessToken: generateAccessTokenMock
}));

vi.mock('../../backend/utils/authExchange.js', () => ({
    consumeAuthCode: consumeAuthCodeMock,
    createAuthCode: createAuthCodeMock
}));

vi.mock('../../backend/models/RateLimitEntry.js', () => ({
    default: {
        findOneAndUpdate: findOneAndUpdateRateLimitMock
    }
}));

const { default: authRouter } = await import('../../backend/routes/authRouter.js');

const buildApp = (author = null) => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
        req.author = author;
        next();
    });
    app.use(authRouter);
    return app;
};

describe('auth router', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        const counters = new Map();

        findOneAndUpdateRateLimitMock.mockImplementation(async (filter) => {
            const nextCount = (counters.get(filter.key) ?? 0) + 1;
            counters.set(filter.key, nextCount);

            return {
                count: nextCount
            };
        });
    });

    it('registers a user with a hashed password', async () => {
        hashPasswordMock.mockResolvedValue('hashed-password');
        createMock.mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            email: 'test@example.com',
            firstName: 'Mario'
        });

        const response = await request(buildApp()).post('/register').send({
            email: 'Test@Example.com ',
            password: 'plain-password',
            firstName: 'Mario',
            googleId: 'should-not-be-stored'
        });

        expect(response.status).toBe(201);
        expect(hashPasswordMock).toHaveBeenCalledWith('plain-password');
        expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
            email: 'test@example.com',
            password: 'hashed-password',
            firstName: 'Mario'
        }));
        expect(createMock).toHaveBeenCalledWith(expect.not.objectContaining({
            googleId: 'should-not-be-stored'
        }));
    });

    it('returns a token and author on successful login', async () => {
        const selectedAuthor = {
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com',
            password: 'stored-hash',
            toJSON: vi.fn().mockReturnValue({
                _id: '507f1f77bcf86cd799439011',
                email: 'author@example.com'
            })
        };

        findOneMock.mockReturnValue({
            select: vi.fn().mockResolvedValue(selectedAuthor)
        });
        verifyPasswordMock.mockResolvedValue(true);
        generateAccessTokenMock.mockReturnValue('jwt-token');

        const response = await request(buildApp()).post('/login').send({
            email: 'author@example.com',
            password: 'correct-password'
        });

        expect(response.status).toBe(200);
        expect(verifyPasswordMock).toHaveBeenCalledWith('correct-password', 'stored-hash');
        expect(generateAccessTokenMock).toHaveBeenCalledWith(selectedAuthor);
        expect(response.body).toEqual({
            token: 'jwt-token',
            author: {
                _id: '507f1f77bcf86cd799439011',
                email: 'author@example.com'
            }
        });
    });

    it('rejects invalid credentials on login', async () => {
        findOneMock.mockReturnValue({
            select: vi.fn().mockResolvedValue(null)
        });

        const response = await request(buildApp()).post('/login').send({
            email: 'missing@example.com',
            password: 'wrong-password'
        });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Invalid credentials' });
    });

    it('returns the authenticated user on /me', async () => {
        const author = {
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com'
        };

        const response = await request(buildApp(author)).get('/me');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(author);
    });

    it('exchanges a valid Google auth code for the JWT payload', async () => {
        consumeAuthCodeMock.mockResolvedValue({
            author: {
                _id: '507f1f77bcf86cd799439011',
                email: 'author@example.com'
            },
            token: 'jwt-token'
        });

        const response = await request(buildApp()).post('/auth/google/exchange-code').send({
            code: 'one-time-code'
        });

        expect(response.status).toBe(200);
        expect(consumeAuthCodeMock).toHaveBeenCalledWith('one-time-code');
        expect(response.body).toEqual({
            author: {
                _id: '507f1f77bcf86cd799439011',
                email: 'author@example.com'
            },
            token: 'jwt-token'
        });
    });

    it('rejects invalid Google auth codes', async () => {
        consumeAuthCodeMock.mockResolvedValue(null);

        const response = await request(buildApp()).post('/auth/google/exchange-code').send({
            code: 'expired-code'
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'Google auth code is invalid or expired' });
    });

    it('clears the auth cookie on logout', async () => {
        const response = await request(buildApp()).post('/logout');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Logged out successfully' });
    });

    it('rate limits repeated login attempts', async () => {
        findOneMock.mockReturnValue({
            select: vi.fn().mockResolvedValue(null)
        });
        const clientIp = '203.0.113.50';

        for (let index = 0; index < 5; index += 1) {
            const response = await request(buildApp())
                .post('/login')
                .set('x-forwarded-for', clientIp)
                .send({
                    email: 'missing@example.com',
                    password: 'wrong-password'
                });

            expect(response.status).toBe(401);
        }

        const rateLimitedResponse = await request(buildApp())
            .post('/login')
            .set('x-forwarded-for', clientIp)
            .send({
                email: 'missing@example.com',
                password: 'wrong-password'
            });

        expect(rateLimitedResponse.status).toBe(429);
        expect(rateLimitedResponse.body).toEqual({
            message: 'Too many login attempts. Please try again later.'
        });
    });
});
