// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    UNAUTHORIZED_EVENT,
    clearStoredAuthToken,
    createComment,
    deleteComment,
    deletePost,
    exchangeGoogleAuthCode,
    fetchJson,
    getAuthorById,
    getLikes,
    getGoogleLoginUrl,
    getStoredAuthToken,
    listPostTags,
    listComments,
    login,
    logoutApi,
    normalizeAuthenticatedUser,
    register,
    toggleLike,
    updateAuthor,
    updateComment,
    updatePost,
    uploadAuthorAvatar,
} from '../../frontend/src/assets/api.js';

describe('frontend api helpers', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        window.sessionStorage.clear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('sends credentials with every request', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [{ id: 1 }]
        });
        vi.stubGlobal('fetch', fetchMock);

        await fetchJson('/api/v1/posts');

        const [, options] = fetchMock.mock.calls[0];
        expect(options.credentials).toBe('include');
    });

    it('sends credentials with every request for cookie-based auth', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [{ id: 1 }]
        });
        vi.stubGlobal('fetch', fetchMock);

        await fetchJson('/api/v1/posts');

        const [, options] = fetchMock.mock.calls[0];
        expect(options.credentials).toBe('include');
        // REMOVED: No longer checks for Authorization header - relies on HttpOnly cookie
    });

    it('builds the Google login URL against the versioned backend base URL', () => {
        expect(getGoogleLoginUrl()).toBe('http://localhost:3000/api/v1/auth/google');
    });

    it('exchanges a one-time Google auth code via POST with credentials', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                token: 'new-token',
                author: {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'author@example.com'
                }
            })
        });
        vi.stubGlobal('fetch', fetchMock);

        const response = await exchangeGoogleAuthCode('one-time-code');

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('http://localhost:3000/api/v1/auth/google/exchange-code');
        expect(options.method).toBe('POST');
        expect(options.credentials).toBe('include');
        // REMOVED: No longer stores token in sessionStorage - relies on HttpOnly cookie
        expect(response.author).toEqual({
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com'
        });
    });

    it('calls POST /logout when logging out', async () => {
        // REMOVED: No longer sets sessionStorage token
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ message: 'Logged out successfully' })
        });
        vi.stubGlobal('fetch', fetchMock);

        await logoutApi();

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('http://localhost:3000/api/v1/auth/logout');
        expect(options.method).toBe('POST');
        // REMOVED: No longer checks sessionStorage clearing - relies on HttpOnly cookie
    });

    it('sends credentials for protected mutations', async () => {
        // REMOVED: No longer sets sessionStorage token
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ message: 'ok' })
        });
        vi.stubGlobal('fetch', fetchMock);

        await updatePost('post-1', { title: 'Updated' });
        await deletePost('post-1');
        await updateComment({ postId: 'post-1', commentId: 'comment-1', comment: 'Updated' });
        await deleteComment({ postId: 'post-1', commentId: 'comment-1' });

        for (const [, options] of fetchMock.mock.calls) {
            expect(options.credentials).toBe('include');
            // REMOVED: No longer checks Authorization header - relies on HttpOnly cookie
        }
    });

    it('normalizes authenticated user payloads', () => {
        expect(normalizeAuthenticatedUser({
            _id: { toString: () => '507f1f77bcf86cd799439011' },
            email: 'AUTHOR@example.com '
        })).toEqual({
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com'
        });

        // REMOVED: No longer clears sessionStorage - relies on HttpOnly cookie
    });

    it('dispatches an unauthorized event on 401 responses', async () => {
        const listener = vi.fn();
        window.addEventListener(UNAUTHORIZED_EVENT, listener);

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ message: 'Token not valid' })
        }));

        await expect(fetchJson('/me')).rejects.toThrow('Token not valid');
        expect(listener).toHaveBeenCalledTimes(1);

        window.removeEventListener(UNAUTHORIZED_EVENT, listener);
    });

    it('listComments sends GET to /api/v1/posts/:id/comments with credentials', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [{ _id: 'c1', comment: 'Hello', author: { _id: 'a1', email: 'user@example.com' } }]
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await listComments('post-42');

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('http://localhost:3000/api/v1/posts/post-42/comments');
        expect(options.method).toBe('GET');
        expect(options.credentials).toBe('include');
        expect(result).toEqual([{ _id: 'c1', comment: 'Hello', author: { _id: 'a1', email: 'user@example.com' } }]);
    });

    it('createComment sends POST with JSON body { comment } to /api/v1/posts/:id/comments', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ _id: 'c2', comment: 'New comment', author: { _id: 'a1', email: 'user@example.com' } })
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await createComment('post-42', 'New comment');

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('http://localhost:3000/api/v1/posts/post-42/comments');
        expect(options.method).toBe('POST');
        expect(options.credentials).toBe('include');
        expect(options.headers.get('Content-Type')).toBe('application/json');
        expect(JSON.parse(options.body)).toEqual({ comment: 'New comment' });
        expect(result).toEqual({ _id: 'c2', comment: 'New comment', author: { _id: 'a1', email: 'user@example.com' } });
    });

    it('getLikes sends GET to /api/v1/posts/:id/likes with credentials', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ count: 7, likedByMe: true })
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await getLikes('post-99');

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('http://localhost:3000/api/v1/posts/post-99/likes');
        expect(options.method).toBe('GET');
        expect(options.credentials).toBe('include');
        expect(result).toEqual({ count: 7, likedByMe: true });
    });

    it('toggleLike sends POST (no body) to /api/v1/posts/:id/likes with credentials', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ count: 8, likedByMe: false })
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await toggleLike('post-99');

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('http://localhost:3000/api/v1/posts/post-99/likes');
        expect(options.method).toBe('POST');
        expect(options.credentials).toBe('include');
        // body should be undefined / empty since we pass no payload
        expect(options.body).toBeUndefined();
        expect(result).toEqual({ count: 8, likedByMe: false });
    });

    it('getAuthorById sends GET to /api/v1/authors/:id with credentials', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ _id: 'author-1', profile: 'Bio' })
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await getAuthorById('author-1');

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('http://localhost:3000/api/v1/authors/author-1');
        expect(options.method).toBe('GET');
        expect(options.credentials).toBe('include');
        expect(result).toEqual({ _id: 'author-1', profile: 'Bio' });
    });

    it('updateAuthor sends PUT to /api/v1/authors/:id with JSON payload', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ _id: 'author-1', profile: 'Updated bio' })
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await updateAuthor('author-1', { profile: 'Updated bio', birthDate: null });

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('http://localhost:3000/api/v1/authors/author-1');
        expect(options.method).toBe('PUT');
        expect(options.credentials).toBe('include');
        expect(options.headers.get('Content-Type')).toBe('application/json');
        expect(JSON.parse(options.body)).toEqual({ profile: 'Updated bio', birthDate: null });
        expect(result).toEqual({ _id: 'author-1', profile: 'Updated bio' });
    });

    it('uploadAuthorAvatar sends PATCH multipart/form-data to /api/v1/authors/:id/avatar', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ _id: 'author-1', avatar: 'https://cdn.example/avatar.jpg' })
        });
        vi.stubGlobal('fetch', fetchMock);

        const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
        const result = await uploadAuthorAvatar('author-1', file);

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('http://localhost:3000/api/v1/authors/author-1/avatar');
        expect(options.method).toBe('PATCH');
        expect(options.credentials).toBe('include');
        expect(options.body).toBeInstanceOf(FormData);
        expect(options.body.get('avatar')).toBe(file);
        expect(result).toEqual({ _id: 'author-1', avatar: 'https://cdn.example/avatar.jpg' });
    });

    it('listPostTags sends GET to /api/v1/posts/tags with credentials', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [
                { tag: 'ai', count: 5 },
                { tag: 'web-dev', count: 3 }
            ]
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await listPostTags();

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('http://localhost:3000/api/v1/posts/tags');
        expect(options.method).toBe('GET');
        expect(options.credentials).toBe('include');
        expect(result).toEqual([
            { tag: 'ai', count: 5 },
            { tag: 'web-dev', count: 3 }
        ]);
    });
});
