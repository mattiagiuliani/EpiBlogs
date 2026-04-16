import express from '../../backend/node_modules/express/index.js';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createPostMock = vi.fn((_req, res) => res.send({ route: 'createPost' }));
const createCommentMock = vi.fn((_req, res) => res.send({ route: 'createComment' }));
const updateAuthorMock = vi.fn((_req, res) => res.send({ route: 'updateAuthor' }));

vi.mock('../../backend/middlewares/uploadCloudinary.js', () => ({
    default: {
        single: () => (_req, _res, next) => next()
    }
}));

vi.mock('../../backend/routes/posts/postHandlers.js', () => ({
    createPost: createPostMock,
    deletePost: vi.fn(),
    getPostById: vi.fn((_req, res) => res.send([])),
    listPosts: vi.fn((_req, res) => res.send([])),
    listPostsByAuthor: vi.fn((_req, res) => res.send([])),
    searchPosts: vi.fn((_req, res) => res.send({ data: [], total: 0 })),
    updatePost: vi.fn(),
    updatePostCover: vi.fn()
}));

vi.mock('../../backend/routes/posts/commentHandlers.js', () => ({
    createComment: createCommentMock,
    deleteComment: vi.fn(),
    getSingleComment: vi.fn((_req, res) => res.send({})),
    listComments: vi.fn((_req, res) => res.send([])),
    updateComment: vi.fn()
}));

vi.mock('../../backend/routes/authors/handlers.js', () => ({
    createAuthor: vi.fn((_req, res) => res.status(201).send({ route: 'createAuthor' })),
    deleteAuthor: vi.fn(),
    getAuthorById: vi.fn((_req, res) => res.send({})),
    listAuthors: vi.fn((_req, res) => res.send([])),
    updateAuthor: updateAuthorMock,
    updateAuthorAvatar: vi.fn()
}));

const { default: postRouter } = await import('../../backend/routes/postRouter.js');
const { default: authorRouter } = await import('../../backend/routes/authorRouter.js');

const buildApp = ({ authenticated = false } = {}) => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
        if (authenticated) {
            req.author = {
                _id: '507f1f77bcf86cd799439011',
                email: 'author@example.com'
            };
            req.auth = { status: 'authenticated' };
        }
        next();
    });
    app.use(postRouter);
    app.use(authorRouter);
    return app;
};

describe('route protection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('requires authentication for post creation', async () => {
        const response = await request(buildApp()).post('/').send({});

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Token missing or invalid' });
        expect(createPostMock).not.toHaveBeenCalled();
    });

    it('requires authentication for comment creation', async () => {
        const response = await request(buildApp()).post('/507f1f77bcf86cd799439021/comments').send({});

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Token missing or invalid' });
        expect(createCommentMock).not.toHaveBeenCalled();
    });

    it('requires authentication for author updates', async () => {
        const response = await request(buildApp()).put('/507f1f77bcf86cd799439011').send({});

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Token missing or invalid' });
        expect(updateAuthorMock).not.toHaveBeenCalled();
    });

    it('allows protected handlers to execute when authentication is present', async () => {
        const response = await request(buildApp({ authenticated: true }))
            .post('/')
            .send({});

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ route: 'createPost' });
        expect(createPostMock).toHaveBeenCalledOnce();
    });
});
