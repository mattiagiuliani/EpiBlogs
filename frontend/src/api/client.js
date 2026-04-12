/**
 * Central HTTP client for EpiBlogs.
 *
 * All versioned requests go to:
 *   ${VITE_API_URL}/api/v1/{path}
 *
 * VITE_API_URL must be set explicitly — there is no localhost fallback.
 *   Local dev  → create frontend/.env with VITE_API_URL=http://localhost:3000
 *   Production → set VITE_API_URL=https://epiblogs-mxl1.onrender.com in Vercel
 */

const API_URL = import.meta.env.VITE_API_URL;

// Fail fast on misconfiguration so the root cause is immediately obvious.
if (!API_URL) {
    const msg =
        '[EpiBlogs] VITE_API_URL is not configured.\n' +
        'Create frontend/.env with:\n' +
        '  VITE_API_URL=http://localhost:3000                         (local dev)\n' +
        '  VITE_API_URL=https://epiblogs-mxl1.onrender.com           (set in Vercel dashboard)';

    if (import.meta.env.PROD) {
        // Production builds must never fall through to undefined — crash early.
        throw new Error(msg);
    }

    console.error(msg);
}

// Safety: a production bundle should never point to localhost.
if (import.meta.env.PROD && API_URL?.includes('localhost')) {
    console.warn(
        '[EpiBlogs] VITE_API_URL contains "localhost" in a production build. ' +
        'Set VITE_API_URL=https://epiblogs-mxl1.onrender.com in the Vercel dashboard.'
    );
}

/** Base URL of the backend (e.g. https://epiblogs-mxl1.onrender.com). */
export const API_BASE_URL = API_URL ?? '';

/** Versioned API prefix — every resource endpoint lives under this. */
const API_V1 = `${API_BASE_URL}/api/v1`;

// ── Session storage ───────────────────────────────────────────────────────────

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

// ── Internal fetch plumbing ───────────────────────────────────────────────────

const buildHeaders = (existingHeaders = {}, includeContentType = false) => {
    const headers = new Headers(existingHeaders);
    const token = getStoredAuthToken();

    if (includeContentType && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
};

const parseApiError = async (res, fallback) => {
    try {
        const data = await res.json();

        if (Array.isArray(data.errors) && data.errors.length > 0) {
            return data.errors.map((e) => e.message).join(', ');
        }

        if (typeof data.message === 'string' && data.message.trim()) {
            return data.message;
        }
    } catch {
        // Non-JSON body — fall through to generic message.
    }

    return fallback;
};

/**
 * Low-level fetch wrapper shared by both the versioned client and the legacy
 * fetchJson export. Attaches credentials, auth token, and normalises errors.
 *
 * @param {string}  url      Fully-qualified URL to fetch.
 * @param {object}  options  Standard fetch options (method, body, headers…).
 * @param {string}  fallback Error message when the server returns none.
 */
export const rawFetch = async (url, options = {}, fallback = 'Request failed') => {
    const hasBody = options.body !== undefined;
    const isFormData = options.body instanceof FormData;

    const res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: buildHeaders(options.headers, hasBody && !isFormData),
    });

    if (!res.ok) {
        if (res.status === 401 && typeof window !== 'undefined') {
            window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
        }

        throw new Error(await parseApiError(res, fallback));
    }

    return res.json();
};

// ── Versioned client ──────────────────────────────────────────────────────────

/**
 * Sends a request to ${API_V1}{path}, serialising `body` to JSON automatically.
 */
const versionedRequest = (method, path, body, fallback) => {
    const isFormData = body instanceof FormData;

    return rawFetch(
        `${API_V1}${path}`,
        {
            method,
            ...(body !== undefined
                ? { body: isFormData ? body : JSON.stringify(body) }
                : {}),
        },
        fallback,
    );
};

/**
 * Typed API client.  All paths are relative to /api/v1, e.g.:
 *   client.get('/posts')           → GET  ${VITE_API_URL}/api/v1/posts
 *   client.post('/auth/login', {}) → POST ${VITE_API_URL}/api/v1/auth/login
 */
const client = {
    get:   (path, fallback) => versionedRequest('GET',    path, undefined, fallback),
    post:  (path, body, fallback) => versionedRequest('POST',   path, body, fallback),
    put:   (path, body, fallback) => versionedRequest('PUT',    path, body, fallback),
    patch: (path, body, fallback) => versionedRequest('PATCH',  path, body, fallback),
    del:   (path, fallback) => versionedRequest('DELETE', path, undefined, fallback),

    /**
     * Returns the absolute URL for starting Google OAuth.
     * Used with window.location.assign() — must be an absolute URL.
     */
    googleLoginUrl: () => `${API_V1}/auth/google`,
};

export default client;
