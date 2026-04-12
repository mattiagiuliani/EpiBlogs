import { afterEach, describe, expect, it } from 'vitest';
import { getCallbackUrl, isGoogleOAuthConfigured } from '../../backend/utils/googleOAuth.js';

// Snapshot the original env so we can restore it after every test.
const originalEnv = {
    DEVELOPMENT_GOOGLE_CALLBACK_URL: process.env.DEVELOPMENT_GOOGLE_CALLBACK_URL,
    DEPLOYMENT_GOOGLE_CALLBACK_URL: process.env.DEPLOYMENT_GOOGLE_CALLBACK_URL,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
    NODE_ENV: process.env.NODE_ENV
};

afterEach(() => {
    Object.assign(process.env, originalEnv);

    for (const key of Object.keys(originalEnv)) {
        if (originalEnv[key] === undefined) {
            delete process.env[key];
        }
    }
});

describe('getCallbackUrl — dynamic environment selection', () => {
    it('returns DEVELOPMENT_GOOGLE_CALLBACK_URL when NODE_ENV is not production', () => {
        process.env.NODE_ENV = 'development';
        process.env.DEVELOPMENT_GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';
        process.env.DEPLOYMENT_GOOGLE_CALLBACK_URL = 'https://epiblogs-mxl1.onrender.com/auth/google/callback';

        expect(getCallbackUrl()).toBe('http://localhost:3000/auth/google/callback');
    });

    it('returns DEPLOYMENT_GOOGLE_CALLBACK_URL when NODE_ENV is production', () => {
        process.env.NODE_ENV = 'production';
        process.env.DEVELOPMENT_GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';
        process.env.DEPLOYMENT_GOOGLE_CALLBACK_URL = 'https://epiblogs-mxl1.onrender.com/auth/google/callback';

        expect(getCallbackUrl()).toBe('https://epiblogs-mxl1.onrender.com/auth/google/callback');
    });

    it('falls back to GOOGLE_CALLBACK_URL when split vars are absent (development)', () => {
        process.env.NODE_ENV = 'development';
        delete process.env.DEVELOPMENT_GOOGLE_CALLBACK_URL;
        delete process.env.DEPLOYMENT_GOOGLE_CALLBACK_URL;
        process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';

        expect(getCallbackUrl()).toBe('http://localhost:3000/auth/google/callback');
    });

    it('falls back to GOOGLE_CALLBACK_URL when split vars are absent (production)', () => {
        process.env.NODE_ENV = 'production';
        delete process.env.DEVELOPMENT_GOOGLE_CALLBACK_URL;
        delete process.env.DEPLOYMENT_GOOGLE_CALLBACK_URL;
        process.env.GOOGLE_CALLBACK_URL = 'https://epiblogs-mxl1.onrender.com/auth/google/callback';

        expect(getCallbackUrl()).toBe('https://epiblogs-mxl1.onrender.com/auth/google/callback');
    });

    it('returns an empty string when no callback URL env var is set', () => {
        delete process.env.DEVELOPMENT_GOOGLE_CALLBACK_URL;
        delete process.env.DEPLOYMENT_GOOGLE_CALLBACK_URL;
        delete process.env.GOOGLE_CALLBACK_URL;

        expect(getCallbackUrl()).toBe('');
    });

    it('trims whitespace from the selected URL', () => {
        process.env.NODE_ENV = 'development';
        process.env.DEVELOPMENT_GOOGLE_CALLBACK_URL = '  http://localhost:3000/auth/google/callback  ';

        expect(getCallbackUrl()).toBe('http://localhost:3000/auth/google/callback');
    });
});

describe('isGoogleOAuthConfigured — callback URL variants', () => {
    it('returns true when split env vars are set for the current environment', () => {
        process.env.NODE_ENV = 'development';
        process.env.GOOGLE_CLIENT_ID = 'client-id';
        process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
        process.env.DEVELOPMENT_GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';

        expect(isGoogleOAuthConfigured()).toBe(true);
    });

    it('returns false when the callback URL is missing for the current environment', () => {
        process.env.NODE_ENV = 'development';
        process.env.GOOGLE_CLIENT_ID = 'client-id';
        process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
        delete process.env.DEVELOPMENT_GOOGLE_CALLBACK_URL;
        delete process.env.DEPLOYMENT_GOOGLE_CALLBACK_URL;
        delete process.env.GOOGLE_CALLBACK_URL;

        expect(isGoogleOAuthConfigured()).toBe(false);
    });
});
