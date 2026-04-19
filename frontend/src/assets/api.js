/**
 * Domain-level API functions.
 *
 * All network requests go through the central client in src/api/client.js,
 * which reads VITE_API_URL and prepends /api/v1 to every path automatically.
 *
 * Backend routes served at both legacy and versioned paths (see auth/paths.js),
 * so migrating all calls to /api/v1/auth/* requires no backend changes.
 */
import {
    client,
    API_BASE_URL,
    clearStoredAuthToken,
    getStoredAuthToken,
    rawFetch,
    storeAuthToken,
    UNAUTHORIZED_EVENT,
} from '../api/client.js';

// Re-export primitives consumed by hooks and components.
export { clearStoredAuthToken, getStoredAuthToken, storeAuthToken, UNAUTHORIZED_EVENT };

// ── User normalization ────────────────────────────────────────────────────────

export const normalizeAuthenticatedUser = (user) => {
    const id =
        typeof user?._id === 'string'
            ? user._id
            : typeof user?._id?.toString === 'function'
              ? user._id.toString()
              : '';
    const email =
        typeof user?.email === 'string' ? user.email.trim().toLowerCase() : '';

    return id && email ? { _id: id, email } : null;
};

// ── Legacy low-level helper ───────────────────────────────────────────────────
// fetchJson is kept so that existing tests that exercise the HTTP plumbing
// (credentials, auth headers, 401 event) continue to work against the real
// implementation without modification.  Components should use the typed
// domain functions below rather than calling fetchJson directly.

export const fetchJson = (path, options = {}, fallback = 'Request failed') =>
    rawFetch(`${API_BASE_URL}${path}`, options, fallback);

// ── Auth domain functions ─────────────────────────────────────────────────────

export const login = async (credentials) => {
    const response = await client.post('/auth/login', credentials, 'Login failed');
    return { ...response, author: normalizeAuthenticatedUser(response.author) };
};

// Registration creates an Author document via the author resource endpoint.
// POST /api/v1/authors maps to the same createAuthor handler as POST /authors.
export const register = (payload) =>
    client.post('/authors', payload, 'Registration failed');

export const getMe = async () => {
    const response = await client.get('/auth/me', 'Unable to load the authenticated user');
    return normalizeAuthenticatedUser(response);
};

export const logoutApi = async () => {
    const response = await client.post('/auth/logout', undefined, 'Logout failed');

    // REMOVED: No longer clear frontend storage - rely on HttpOnly cookie only
    return response;
};

/** Returns the absolute URL for the Google OAuth entry point. */
export const getGoogleLoginUrl = () => client.googleLoginUrl();

export const exchangeGoogleAuthCode = async (code) => {
    const response = await client.post(
        '/auth/google/exchange-code',
        { code },
        'Google authentication failed'
    );

    return { ...response, author: normalizeAuthenticatedUser(response.author) };
};

// ── Category domain functions ─────────────────────────────────────────────────

export const listCategories = () =>
    client.get('/categories', 'Error fetching categories');

// ── Author domain functions ───────────────────────────────────────────────────

export const listAuthors = () =>
    client.get('/authors', 'Error fetching authors');

export const getAuthorById = (authorId) =>
    client.get(`/authors/${authorId}`, 'Error fetching author profile');

export const updateAuthor = (authorId, payload) =>
    client.put(`/authors/${authorId}`, payload, 'Error updating author profile');

export const uploadAuthorAvatar = (authorId, file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    return client.patch(`/authors/${authorId}/avatar`, formData, 'Error uploading author avatar');
};

// ── Post domain functions ─────────────────────────────────────────────────────

/**
 * @param {URLSearchParams} params  Query params (search, page, limit).
 */
export const listPosts = (params) =>
    client.get(`/posts?${params.toString()}`, 'Error fetching posts');

/**
 * Full-text search via the scalable POST endpoint.
 * Uses the MongoDB text index (title + content) instead of regex.
 * @param {{ search?: string, categorySlug?: string, tags?: string[] }} body
 * @param {URLSearchParams} [params]  Pagination (?page=&limit=).
 */
export const searchPosts = (body, params = new URLSearchParams()) =>
    client.post(
        `/posts/search?${params.toString()}`,
        body,
        'Error searching posts',
    );

export const updatePost = (postId, payload) =>
    client.put(`/posts/${postId}`, payload, 'Error updating post');

export const deletePost = (postId) =>
    client.del(`/posts/${postId}`, 'Error deleting post');

/**
 * Fetch available tags for filtering. Returns array of {tag, count} objects sorted by popularity.
 * Gracefully handles both new format {data: [{tag, count}]} and legacy string arrays.
 * @returns {Promise<{tag: string, count: number}[]>} Array of tags with usage count
 */
export const listPostTags = async () => {
    try {
        const response = await client.get('/posts/tags', 'Error fetching post tags');
        const data = response?.data ?? response;
        
        // New format: already {tag, count}
        if (Array.isArray(data) && data.some(item => item?.tag && typeof item?.count === 'number')) {
            return data;
        }
        
        // Legacy format: array of strings → convert with count: 0
        if (Array.isArray(data) && data.every(item => typeof item === 'string')) {
            return data.map(tag => ({ tag: String(tag).trim(), count: 0 })).filter(item => item.tag);
        }
        
        // Fallback: empty array if format unexpected
        return [];
    } catch (err) {
        // Silently return empty array on error so UI doesn't break
        console.warn('Failed to fetch tags:', err?.message);
        return [];
    }
};

export const listComments = (postId) =>
    client.get(`/posts/${postId}/comments`, 'Error fetching comments');

export const createComment = (postId, comment) =>
    client.post(`/posts/${postId}/comments`, { comment }, 'Error creating comment');

export const updateComment = ({ postId, commentId, comment }) =>
    client.put(
        `/posts/${postId}/comments/${commentId}`,
        { comment },
        'Error updating comment',
    );

export const deleteComment = ({ postId, commentId }) =>
    client.del(
        `/posts/${postId}/comments/${commentId}`,
        'Error deleting comment',
    );

export const getLikes = (postId) =>
    client.get(`/posts/${postId}/likes`, 'Error fetching likes');

export const toggleLike = (postId) =>
    client.post(`/posts/${postId}/likes`, undefined, 'Error toggling like');
