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

    it('stores the returned token after login and attaches it as a bearer token', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    token: 'jwt-token',
                    author: {
                        _id: '507f1f77bcf86cd799439011',
                        email: 'AUTHOR@example.com '
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [] })
            });
        vi.stubGlobal('fetch', fetchMock);

        const authPayload = await login({ email: 'author@example.com', password: 'secret123' });
        await fetchJson('/api/v1/posts');

        expect(getStoredAuthToken()).toBe('jwt-token');
        expect(authPayload.author).toEqual({
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com'
        });

        const [, requestOptions] = fetchMock.mock.calls[1];
        expect(requestOptions.headers.get('Authorization')).toBe('Bearer jwt-token');
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
        expect(getStoredAuthToken()).toBe('new-token');
        expect(response.author).toEqual({
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com'
        });
    });

    it('calls POST /logout when logging out', async () => {
        window.sessionStorage.setItem('epiblogs.authToken', 'jwt-token');
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ message: 'Logged out successfully' })
        });
        vi.stubGlobal('fetch', fetchMock);

        await logoutApi();

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('http://localhost:3000/api/v1/auth/logout');
        expect(options.method).toBe('POST');
        expect(getStoredAuthToken()).toBe('');
    });

    it('sends authorization headers for protected mutations', async () => {
        window.sessionStorage.setItem('epiblogs.authToken', 'jwt-token');
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
            expect(options.headers.get('Authorization')).toBe('Bearer jwt-token');
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

        clearStoredAuthToken();
        expect(getStoredAuthToken()).toBe('');
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
