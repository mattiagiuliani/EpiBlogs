import Author from '../models/Author.js';
import { verifyAccessToken } from '../utils/jwt.js';

const publicRoutes = [
    { method: 'POST', path: '/login' },
    { method: 'POST', path: '/api/v1/auth/login' },
    { method: 'POST', path: '/register' },
    { method: 'POST', path: '/api/v1/auth/register' },
    { method: 'POST', path: '/authors' },
    { method: 'POST', path: '/api/v1/authors' }
];

const normalizePath = (path) => {
    if (typeof path !== 'string' || path === '/') {
        return path;
    }

    return path.endsWith('/') ? path.slice(0, -1) : path;
};

const extractBearerToken = (authorizationHeader) => {
    if (typeof authorizationHeader !== 'string') {
        return null;
    }

    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return null;
    }

    return token;
};

const authentication = async (request, response, next) => {
    try {
        const requestPath = normalizePath(request.path);
        const isPublicRoute = publicRoutes.some((route) => (
            route.method === request.method && route.path === requestPath
        ));

        if (request.method === 'OPTIONS' || isPublicRoute) {
            return next();
        }

        const token = extractBearerToken(request.headers.authorization);

        if (!token) {
            return response.status(401).send({ message: 'Token missing or invalid' });
        }

        const payload = verifyAccessToken(token);
        const author = await Author.findById(payload.authorId).lean();

        if (!author) {
            return response.status(401).send({ message: 'Token not valid' });
        }

        request.author = author;
        request.token = token;
        next();
    } catch (error) {
        response.status(401).send({ message: 'Token not valid' });
    }
};

export default authentication;
