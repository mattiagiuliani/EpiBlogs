import express from '../../backend/node_modules/express/index.js';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createMock = vi.fn();
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
            firstName: 'Mario'
        });

        expect(response.status).toBe(201);
        expect(hashPasswordMock).toHaveBeenCalledWith('plain-password');
        expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
            email: 'test@example.com',
            password: 'hashed-password',
            firstName: 'Mario'
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
});
