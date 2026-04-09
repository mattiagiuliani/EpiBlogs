import { randomBytes, timingSafeEqual } from 'node:crypto';

const OAUTH_STATE_COOKIE_NAME = 'epiblogs.oauth_state';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

const trimEnv = (value) => (typeof value === 'string' ? value.trim() : '');

const getCookiePathFromCallbackUrl = () => {
    const callbackUrl = trimEnv(process.env.GOOGLE_CALLBACK_URL);

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
    const secureCookieSetting = trimEnv(process.env.OAUTH_COOKIE_SECURE);

    if (secureCookieSetting === 'true') {
        return true;
    }

    if (secureCookieSetting === 'false') {
        return false;
    }

    if (process.env.NODE_ENV === 'production') {
        return true;
    }

    try {
        return new URL(trimEnv(process.env.GOOGLE_CALLBACK_URL)).protocol === 'https:';
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
        path: getCookiePathFromCallbackUrl(),
        sameSite: normalizedSameSite,
        secure: shouldUseSecureCookies()
    };
};

const parseCookies = (cookieHeader) => {
    if (typeof cookieHeader !== 'string' || !cookieHeader.trim()) {
        return {};
    }

    return cookieHeader.split(';').reduce((cookies, part) => {
        const [rawName, ...rawValueParts] = part.split('=');
        const name = rawName?.trim();

        if (!name) {
            return cookies;
        }

        const rawValue = rawValueParts.join('=').trim();

        try {
            cookies[name] = decodeURIComponent(rawValue);
        } catch {
            cookies[name] = rawValue;
        }

        return cookies;
    }, {});
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
