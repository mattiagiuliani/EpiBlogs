import { randomBytes, timingSafeEqual } from 'node:crypto';
import { parseCookies } from './cookieUtils.js';

const OAUTH_STATE_COOKIE_NAME = 'epiblogs.oauth_state';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

const trimEnv = (value) => (typeof value === 'string' ? value.trim() : '');

// Returns the active Google OAuth callback URL, mirroring the same precedence
// used by googleOAuth.js so that cookie path and secure-flag derivation are
// always in sync with the URL that Passport actually uses.
const getActiveCallbackUrl = () => {
    const isProduction = process.env.NODE_ENV?.toLowerCase() === 'production';
    return isProduction
        ? trimEnv(process.env.DEPLOYMENT_GOOGLE_CALLBACK_URL)
        : trimEnv(process.env.DEVELOPMENT_GOOGLE_CALLBACK_URL);
};

const getCookiePathFromCallbackUrl = () => {
    const callbackUrl = getActiveCallbackUrl();

    if (!callbackUrl) {
        return '/';
    }

    try {
        const { pathname } = new URL(callbackUrl);
        const normalizedPath = pathname.endsWith('/') && pathname !== '/'
            ? pathname.slice(0, -1)
            : pathname;
        const lastSlashIndex = normalizedPath.lastIndexOf('/');

        if (lastSlashIndex <= 0) {
            return '/';
        }

        return normalizedPath.slice(0, lastSlashIndex) || '/';
    } catch {
        return '/';
    }
};

const shouldUseSecureCookies = () => {
    // AUTH_COOKIE_SECURE is the canonical env var (documented in .env.example).
    // OAUTH_COOKIE_SECURE is kept as a fallback for backward compatibility.
    const setting = trimEnv(process.env.AUTH_COOKIE_SECURE) || trimEnv(process.env.OAUTH_COOKIE_SECURE);

    if (setting === 'true') return true;
    if (setting === 'false') return false;

    if (process.env.NODE_ENV === 'production') return true;

    try {
        return new URL(getActiveCallbackUrl()).protocol === 'https:';
    } catch {
        return false;
    }
};

export const getOAuthCookieOptions = () => {
    const domain = trimEnv(process.env.OAUTH_COOKIE_DOMAIN);
    const sameSite = trimEnv(process.env.OAUTH_COOKIE_SAME_SITE).toLowerCase();
    const normalizedSameSite = ['lax', 'none', 'strict'].includes(sameSite)
        ? sameSite
        : 'lax';

    return {
        ...(domain ? { domain } : {}),
        httpOnly: true,
        maxAge: OAUTH_STATE_TTL_MS,
        path: '/',  // Use root path for reliable clearing
        sameSite: normalizedSameSite,
        secure: shouldUseSecureCookies()
    };
};

export const createOAuthState = () => randomBytes(32).toString('base64url');

export const setOAuthStateCookie = (response, state) => {
    response.cookie(OAUTH_STATE_COOKIE_NAME, state, getOAuthCookieOptions());
};

export const clearOAuthStateCookie = (response) => {
    response.clearCookie(OAUTH_STATE_COOKIE_NAME, getOAuthCookieOptions());
};

export const readOAuthStateCookie = (request) => {
    const cookies = parseCookies(request.headers?.cookie);
    return cookies[OAUTH_STATE_COOKIE_NAME] ?? '';
};

export const isValidOAuthState = (request) => {
    const stateFromQuery = typeof request.query?.state === 'string'
        ? request.query.state
        : '';
    const stateFromCookie = readOAuthStateCookie(request);

    if (!stateFromQuery || !stateFromCookie) {
        return false;
    }

    const queryBuffer = Buffer.from(stateFromQuery);
    const cookieBuffer = Buffer.from(stateFromCookie);

    if (queryBuffer.length !== cookieBuffer.length) {
        return false;
    }

    return timingSafeEqual(queryBuffer, cookieBuffer);
};

export const oauthStateCookieName = OAUTH_STATE_COOKIE_NAME;
