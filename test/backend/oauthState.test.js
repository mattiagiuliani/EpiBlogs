import { describe, expect, it, vi } from 'vitest';
import {
    clearOAuthStateCookie,
    createOAuthState,
    getOAuthCookieOptions,
    isValidOAuthState,
    oauthStateCookieName,
    readOAuthStateCookie,
    setOAuthStateCookie
} from '../../backend/utils/oauthState.js';

describe('oauth state helpers', () => {
    it('creates a non-empty opaque state token', () => {
        expect(createOAuthState()).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(createOAuthState()).not.toBe(createOAuthState());
    });

    it('stores and clears the oauth state cookie with secure defaults', () => {
        const response = {
            clearCookie: vi.fn(),
            cookie: vi.fn()
        };

        setOAuthStateCookie(response, 'state-token');
        clearOAuthStateCookie(response);

        expect(response.cookie).toHaveBeenCalledWith(
            oauthStateCookieName,
            'state-token',
            expect.objectContaining({
                httpOnly: true,
                path: '/',
                sameSite: 'lax'
            })
        );
        expect(response.clearCookie).toHaveBeenCalledWith(
            oauthStateCookieName,
            expect.objectContaining({
                httpOnly: true,
                path: '/',
                sameSite: 'lax'
            })
        );
    });

    it('reads the oauth state cookie from the request headers', () => {
        const request = {
            headers: {
                cookie: 'theme=light; epiblogs.oauth_state=state-token; session=abc'
            }
        };

        expect(readOAuthStateCookie(request)).toBe('state-token');
    });

    it('tolerates malformed cookie encoding instead of throwing', () => {
        const request = {
            headers: {
                cookie: 'epiblogs.oauth_state=%E0%A4%A'
            }
        };

        expect(() => readOAuthStateCookie(request)).not.toThrow();
        expect(readOAuthStateCookie(request)).toBe('%E0%A4%A');
    });

    it('accepts matching state values from query and cookie', () => {
        const request = {
            headers: {
                cookie: 'epiblogs.oauth_state=state-token'
            },
            query: {
                state: 'state-token'
            }
        };

        expect(isValidOAuthState(request)).toBe(true);
    });

    it('derives hardened cookie options from environment settings', () => {
        process.env.DEPLOYMENT_GOOGLE_CALLBACK_URL = 'https://api.example.com/auth/google/callback';
        process.env.NODE_ENV = 'production';
        process.env.OAUTH_COOKIE_DOMAIN = '.example.com';
        process.env.OAUTH_COOKIE_SAME_SITE = 'strict';

        expect(getOAuthCookieOptions()).toEqual(expect.objectContaining({
            domain: '.example.com',
            httpOnly: true,
            path: '/',
            sameSite: 'strict',
            secure: true
        }));

        delete process.env.DEPLOYMENT_GOOGLE_CALLBACK_URL;
        delete process.env.NODE_ENV;
        delete process.env.OAUTH_COOKIE_DOMAIN;
        delete process.env.OAUTH_COOKIE_SAME_SITE;
    });

    it('rejects missing or mismatched state values', () => {
        expect(isValidOAuthState({
            headers: { cookie: 'epiblogs.oauth_state=state-token' },
            query: {}
        })).toBe(false);

        expect(isValidOAuthState({
            headers: { cookie: 'epiblogs.oauth_state=state-token' },
            query: { state: 'other-token' }
        })).toBe(false);
    });
});
