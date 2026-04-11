import { parseCookies } from './cookieUtils.js';

const AUTH_COOKIE_NAME = 'epiblogs.accessToken';

const AUTH_COOKIE_MAX_AGE_MS = 60 * 60 * 1000;

const trimEnv = (value) => (typeof value === 'string' ? value.trim() : '');

const shouldUseSecureCookies = () => {
    const setting = trimEnv(process.env.AUTH_COOKIE_SECURE);

    if (setting === 'true') return true;
    if (setting === 'false') return false;

    return process.env.NODE_ENV === 'production';
};

const getSameSite = () => {
    const setting = trimEnv(process.env.AUTH_COOKIE_SAME_SITE).toLowerCase();
    const secure = shouldUseSecureCookies();

    if (['lax', 'strict', 'none'].includes(setting)) {
        return setting;
    }
    return secure ? 'none' : 'lax';
};

export const getAuthCookieOptions = () => ({
    httpOnly: true,
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    path: '/',
    sameSite: getSameSite(),
    secure: shouldUseSecureCookies()
});

export const setAuthCookie = (response, token) => {
    response.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
};

export const clearAuthCookie = (response) => {
    response.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions());
};

export const readAuthCookie = (request) => {
    const cookies = parseCookies(request.headers?.cookie);
    return cookies[AUTH_COOKIE_NAME] ?? null;
};

export const authCookieName = AUTH_COOKIE_NAME;
