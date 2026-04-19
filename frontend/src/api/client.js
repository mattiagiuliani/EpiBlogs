const DEV_API_URL = import.meta.env.VITE_API_URL_DEVELOPMENT;
const PROD_API_URL = import.meta.env.VITE_API_URL_PRODUCTION;
const LEGACY_API_URL = import.meta.env.VITE_API_URL;

const API_URL = import.meta.env.PROD
    ? (PROD_API_URL || LEGACY_API_URL)
    : (DEV_API_URL || LEGACY_API_URL);

// In production (Vercel build) the variable MUST be present — a missing value
// means the env var was never set in the Vercel dashboard.
// In local development we fall back to localhost so the app starts even when
// the developer hasn't copied .env.example → .env yet.
if (!API_URL && import.meta.env.PROD) {
    throw new Error('[EpiBlogs] Missing VITE_API_URL_PRODUCTION');
}

if (!API_URL && !import.meta.env.PROD) {
    console.warn(
        '[EpiBlogs] VITE_API_URL_DEVELOPMENT is not set. ' +
        'Falling back to http://localhost:3000. ' +
        'Copy frontend/.env.example → frontend/.env and restart Vite to silence this.'
    );
}

// TEMPORARY DEBUG LOG — remove once Vercel env var is confirmed working.
console.log('[ENV DEBUG] API URL selected =', API_URL);

const normalizeBase = (url) => {
    try {
        return new URL(url).origin;
    } catch {
        throw new Error('[EpiBlogs] Invalid API URL env format');
    }
};

export const API_BASE_URL = normalizeBase(API_URL ?? 'http://localhost:3000');
const API_V1 = `${API_BASE_URL}/api/v1`;

if (import.meta.env.PROD && API_BASE_URL.includes('localhost')) {
    console.warn(
        '[EpiBlogs] WARNING: localhost detected in production API config'
    );
}

export const UNAUTHORIZED_EVENT = 'epiblogs:unauthorized';
const AUTH_TOKEN_KEY = 'epiblogs.authToken';

const getStorage = () =>
    typeof window !== 'undefined' ? window.sessionStorage : null;

export const getStoredAuthToken = () =>
    getStorage()?.getItem(AUTH_TOKEN_KEY) ?? '';

export const storeAuthToken = (token) => {
    const normalized = typeof token === 'string' ? token.trim() : '';

    if (!normalized) {
        getStorage()?.removeItem(AUTH_TOKEN_KEY);
        return '';
    }

    getStorage()?.setItem(AUTH_TOKEN_KEY, normalized);
    return normalized;
};

export const clearStoredAuthToken = () =>
    getStorage()?.removeItem(AUTH_TOKEN_KEY);

const buildHeaders = (existingHeaders = {}, includeContentType = false) => {
    const headers = new Headers(existingHeaders);

    if (includeContentType && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    // REMOVED: No longer send Authorization header - rely on HttpOnly cookie only
    return headers;
};

const parseApiError = async (res, fallback) => {
    try {
        const data = await res.json();

        if (Array.isArray(data.errors)) {
            return data.errors.map((e) => e.message).join(', ');
        }

        if (data?.message) {
            return data.message;
        }
    } catch {
        // ignore non-json errors
    }

    return fallback;
};

export const rawFetch = async (url, options = {}, fallback = 'Request failed') => {
    const hasBody = options.body !== undefined;
    const isFormData = options.body instanceof FormData;

    const res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: buildHeaders(options.headers, hasBody && !isFormData),
    });

    if (!res.ok) {
        if (res.status === 401) {
            window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
        }

        throw new Error(await parseApiError(res, fallback));
    }

    return res.json();
};

const request = (method, path, body, fallback) => {
    return rawFetch(
        `${API_V1}${path}`,
        {
            method,
            ...(body !== undefined && {
                body: body instanceof FormData ? body : JSON.stringify(body),
            }),
        },
        fallback
    );
};

const client = {
    get: (path, fallback) => request('GET', path, undefined, fallback),
    post: (path, body, fallback) => request('POST', path, body, fallback),
    put: (path, body, fallback) => request('PUT', path, body, fallback),
    patch: (path, body, fallback) => request('PATCH', path, body, fallback),
    del: (path, fallback) => request('DELETE', path, undefined, fallback),

    // IMPORTANT: always absolute URL for OAuth
    googleLoginUrl: () =>
        `${API_BASE_URL}/api/v1/auth/google`,
};

export default client;