// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    UNAUTHORIZED_EVENT,
    clearStoredToken,
    exchangeGoogleAuthCode,
    fetchJson,
    getGoogleLoginUrl,
    getStoredToken,
    login,
    register,
    setStoredToken
} from '../../frontend/src/assets/api.js';

describe('frontend api helpers', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('stores and retrieves the access token from localStorage', () => {
        setStoredToken('abc123');

        expect(getStoredToken()).toBe('abc123');

        clearStoredToken();
        expect(getStoredToken()).toBeNull();
    });

    it('adds the bearer token to authenticated requests', async () => {
        setStoredToken('jwt-token');
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [{ id: 1 }]
        });
        vi.stubGlobal('fetch', fetchMock);

        await fetchJson('/api/v1/posts');

        expect(fetchMock).toHaveBeenCalledWith(
            'http://localhost:3000/api/v1/posts',
            expect.objectContaining({
                headers: expect.any(Headers)
            })
        );
        const [, options] = fetchMock.mock.calls[0];
        expect(options.headers.get('Authorization')).toBe('Bearer jwt-token');
    });

    it('does not attach auth headers to login and register requests', async () => {
        setStoredToken('jwt-token');
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ token: 'new-token' })
        });
        vi.stubGlobal('fetch', fetchMock);

        await login({ email: 'author@example.com', password: 'secret123' });
        await register({ firstName: 'Mario', email: 'author@example.com', password: 'secret123' });

        for (const [, options] of fetchMock.mock.calls) {
            expect(options.headers.get('Authorization')).toBeNull();
        }
    });

    it('builds the Google login URL against the backend base URL', () => {
        expect(getGoogleLoginUrl()).toBe('http://localhost:3000/auth/google');
    });

    it('exchanges a one-time Google auth code without auth headers', async () => {
        setStoredToken('jwt-token');
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ token: 'new-token' })
        });
        vi.stubGlobal('fetch', fetchMock);

        await exchangeGoogleAuthCode('one-time-code');

        const [, options] = fetchMock.mock.calls[0];
        expect(fetchMock).toHaveBeenCalledWith(
            'http://localhost:3000/auth/google/exchange-code',
            expect.objectContaining({
                method: 'POST'
            })
        );
        expect(options.headers.get('Authorization')).toBeNull();
    });

    it('dispatches an unauthorized event on authenticated 401 responses', async () => {
        const listener = vi.fn();
        window.addEventListener(UNAUTHORIZED_EVENT, listener);
        setStoredToken('expired-token');

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ message: 'Token not valid' })
        }));

        await expect(fetchJson('/me')).rejects.toThrow('Token not valid');
        expect(listener).toHaveBeenCalledTimes(1);
    });
});
