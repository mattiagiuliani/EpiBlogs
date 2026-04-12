import Author from '../models/Author.js';
import { readAuthCookie } from '../utils/authCookie.js';
import { toAuthenticatedAuthor } from '../utils/authenticatedAuthor.js';
import { verifyAccessToken } from '../utils/jwt.js';

const extractBearerToken = (authorizationHeader) => {
    if (typeof authorizationHeader !== 'string') {
        return null;
    }

    const [scheme, token] = authorizationHeader.trim().split(/\s+/, 2);

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
        return null;
    }

    return token;
};

// Resolves the JWT from an HttpOnly cookie first, then falls back to the
// Authorization: Bearer header so Postman / API clients keep working.
const resolveToken = (request) => {
    return readAuthCookie(request) ?? extractBearerToken(request.headers?.authorization);
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
        const payload = verifyAccessToken(token);
        const author = await Author.findById(payload.authorId).select('email');
        const authenticatedAuthor = toAuthenticatedAuthor(author);

        if (!authenticatedAuthor) {
            request.auth = { status: 'invalid' };
            return request.auth;
        }

        request.author = authenticatedAuthor;
        request.auth = { status: 'authenticated' };
        return request.auth;
    } catch {
        request.auth = { status: 'invalid' };
        return request.auth;
    }
};

const authentication = async (request, _response, next) => {
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
