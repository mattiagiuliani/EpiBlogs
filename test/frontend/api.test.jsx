// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    UNAUTHORIZED_EVENT,
    clearStoredAuthToken,
    deleteComment,
    deletePost,
    exchangeGoogleAuthCode,
    fetchJson,
    getGoogleLoginUrl,
    getStoredAuthToken,
    login,
    logoutApi,
    normalizeAuthenticatedUser,
    register,
    updateComment,
    updatePost,
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
});
