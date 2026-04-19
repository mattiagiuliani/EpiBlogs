import Author from '../models/Author.js';
import { readAuthCookie } from '../utils/authCookie.js';
import { toAuthenticatedAuthor } from '../utils/authenticatedAuthor.js';
import { verifyAccessToken } from '../utils/jwt.js';

// ONLY use HttpOnly cookie as single source of truth
const resolveToken = (request) => {
    return readAuthCookie(request);
};

const applyAuthentication = async (request) => {
    if (request.auth?.status) {
        return request.auth;
    }

    const token = resolveToken(request);

    request.author = null;
    request.token = token ?? null;

    if (!token) {
        request.auth = { status: 'missing' };
        return request.auth;
    }

    try {
        const payload = await verifyAccessToken(token);
        const author = await Author.findById(payload.authorId).select('email');
        const authenticatedAuthor = toAuthenticatedAuthor(author);

        if (!authenticatedAuthor) {
            request.auth = { status: 'invalid' };
            return request.auth;
        }

        request.author = authenticatedAuthor;
        request.auth = { status: 'authenticated' };
        return request.auth;
    } catch (error) {
        request.auth = { status: 'invalid' };
        return request.auth;
    }
};

const authentication = async (request, _response, next) => {
    if (request.method === 'OPTIONS') {
        return next();
    }

    // Skip authentication for auth routes to avoid conflicts with login/logout flows
    if (request.path?.startsWith('/api/v1/auth/')) {
        return next();
    }

    await applyAuthentication(request);
    next();
};

export const requireAuthentication = async (request, response, next) => {
    const auth = await applyAuthentication(request);

    if (auth.status === 'missing') {
        return response.status(401).send({ message: 'Token missing or invalid' });
    }

    if (auth.status !== 'authenticated') {
        return response.status(401).send({ message: 'Token not valid' });
    }

    next();
};

export default authentication;
