import passport from '../../backend/node_modules/passport/lib/index.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authExchange from '../../backend/utils/authExchange.js';
import * as googleOAuth from '../../backend/utils/googleOAuth.js';
import * as jwtUtils from '../../backend/utils/jwt.js';
import * as oauthState from '../../backend/utils/oauthState.js';
import {
    handleGoogleAuthenticationCallback,
    startGoogleAuthentication
} from '../../backend/routes/auth/handlers.js';

const createResponse = () => ({
    redirect: vi.fn(),
    send: vi.fn(),
    status: vi.fn().mockReturnThis(),
    clearCookie: vi.fn()
});

describe('google oauth handlers', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('starts Google auth with the generated state', () => {
        const request = {};
        const response = createResponse();
        const next = vi.fn();
        const passportMiddleware = vi.fn();

        vi.spyOn(googleOAuth, 'isGoogleOAuthConfigured').mockReturnValue(true);
        vi.spyOn(googleOAuth, 'ensureGoogleOAuthStrategy').mockImplementation(() => {});
        vi.spyOn(googleOAuth, 'getGoogleStrategyName').mockReturnValue('google');
        vi.spyOn(oauthState, 'createOAuthState').mockReturnValue('oauth-state');
        vi.spyOn(oauthState, 'setOAuthStateCookie').mockImplementation(() => {});
        vi.spyOn(oauthState, 'clearOAuthStateCookie').mockImplementation(() => {});
        vi.spyOn(passport, 'authenticate').mockReturnValue(passportMiddleware);

        startGoogleAuthentication(request, response, next);

        expect(oauthState.clearOAuthStateCookie).toHaveBeenCalledWith(response);
        expect(oauthState.setOAuthStateCookie).toHaveBeenCalledWith(response, 'oauth-state');
        expect(passport.authenticate).toHaveBeenCalledWith('google', {
            scope: ['email', 'profile'],
            session: false,
            state: 'oauth-state',
            prompt: 'consent'
        });
        expect(passportMiddleware).toHaveBeenCalledWith(request, response, next);
    });

    it('redirects back to the frontend when Google authentication fails', () => {
        const request = {
            query: {
                state: 'oauth-state'
            }
        };
        const response = createResponse();
        const next = vi.fn();

        vi.spyOn(googleOAuth, 'isGoogleOAuthConfigured').mockReturnValue(true);
        vi.spyOn(googleOAuth, 'ensureGoogleOAuthStrategy').mockImplementation(() => {});
        vi.spyOn(googleOAuth, 'getGoogleStrategyName').mockReturnValue('google');
        vi.spyOn(googleOAuth, 'getFrontendAppUrl').mockImplementation(
            () => `http://localhost:5173`
        );
        vi.spyOn(oauthState, 'isValidOAuthState').mockReturnValue(true);
        vi.spyOn(oauthState, 'clearOAuthStateCookie').mockImplementation(() => {});
        vi.spyOn(passport, 'authenticate').mockImplementation((_strategy, _options, callback) => (
            () => callback(new Error('provider failure'))
        ));

        handleGoogleAuthenticationCallback(request, response, next);

        expect(oauthState.clearOAuthStateCookie).toHaveBeenCalledWith(response);
        expect(response.redirect).toHaveBeenCalledWith(
            'http://localhost:5173/auth/callback?error=google_login_failed'
        );
    });

    it('redirects back to the frontend with a one-time code on success', () => {
        const request = {
            query: {
                state: 'oauth-state'
            }
        };
        const response = createResponse();
        const next = vi.fn();
        const author = {
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com',
            toJSON: vi.fn().mockReturnValue({
                _id: '507f1f77bcf86cd799439011',
                email: 'author@example.com'
            })
        };

        vi.spyOn(googleOAuth, 'isGoogleOAuthConfigured').mockReturnValue(true);
        vi.spyOn(googleOAuth, 'ensureGoogleOAuthStrategy').mockImplementation(() => {});
        vi.spyOn(googleOAuth, 'getGoogleStrategyName').mockReturnValue('google');
        vi.spyOn(googleOAuth, 'getFrontendAppUrl').mockImplementation(
            ({ code }) => `http://localhost:5173/auth/callback?code=${code}`
        );
        vi.spyOn(oauthState, 'isValidOAuthState').mockReturnValue(true);
        vi.spyOn(oauthState, 'clearOAuthStateCookie').mockImplementation(() => {});
        vi.spyOn(jwtUtils, 'generateAccessToken').mockReturnValue('jwt-token');
        vi.spyOn(authExchange, 'createAuthCode').mockResolvedValue('one-time-code');
        vi.spyOn(passport, 'authenticate').mockImplementation((_strategy, _options, callback) => (
            () => callback(null, author)
        ));

        handleGoogleAuthenticationCallback(request, response, next);

        expect(oauthState.clearOAuthStateCookie).toHaveBeenCalledWith(response);
        expect(jwtUtils.generateAccessToken).toHaveBeenCalledWith(author);
        expect(authExchange.createAuthCode).toHaveBeenCalledWith({
            author: {
                _id: '507f1f77bcf86cd799439011',
                email: 'author@example.com'
            },
            token: 'jwt-token'
        });
        return Promise.resolve().then(() => {
            expect(response.redirect).toHaveBeenCalledWith(
                'http://localhost:5173/auth/callback?code=one-time-code'
            );
        });
    });
});
