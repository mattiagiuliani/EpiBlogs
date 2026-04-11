// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    UNAUTHORIZED_EVENT,
    exchangeGoogleAuthCode,
    fetchJson,
    getGoogleLoginUrl,
    login,
    logoutApi,
    register,
} from '../../frontend/src/assets/api.js';

describe('frontend api helpers', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
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

    it('does not attach an Authorization header to requests', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({})
        });
        vi.stubGlobal('fetch', fetchMock);

        await login({ email: 'author@example.com', password: 'secret123' });
        await register({ firstName: 'Mario', email: 'author@example.com', password: 'secret123' });
        await fetchJson('/api/v1/posts');

        for (const [, options] of fetchMock.mock.calls) {
            const authHeader = options.headers instanceof Headers
                ? options.headers.get('Authorization')
                : (options.headers ?? {})['Authorization'] ?? null;
            expect(authHeader).toBeNull();
        }
    });

    it('builds the Google login URL against the backend base URL', () => {
        expect(getGoogleLoginUrl()).toBe('http://localhost:3000/auth/google');
    });

    it('exchanges a one-time Google auth code via POST with credentials', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ token: 'new-token' })
        });
        vi.stubGlobal('fetch', fetchMock);

        await exchangeGoogleAuthCode('one-time-code');

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('http://localhost:3000/auth/google/exchange-code');
        expect(options.method).toBe('POST');
        expect(options.credentials).toBe('include');
    });

    it('calls POST /logout when logging out', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ message: 'Logged out successfully' })
        });
        vi.stubGlobal('fetch', fetchMock);

        await logoutApi();

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('http://localhost:3000/logout');
        expect(options.method).toBe('POST');
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
