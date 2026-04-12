import jwt from 'jsonwebtoken';
import { toAuthenticatedAuthor } from './authenticatedAuthor.js';

const getJwtSecret = () => {
    // JWT_SECRET_KEY is the canonical name (documented in .env.example).
    // JWT_SECRET is supported as an alias for environments that use that convention.
    const secret = process.env.JWT_SECRET_KEY?.trim() || process.env.JWT_SECRET?.trim();

    if (!secret) {
        throw new Error('JWT_SECRET_KEY is not configured');
    }

    return secret;
};

export const generateAccessToken = (author) => {
    const authenticatedAuthor = toAuthenticatedAuthor(author);

    if (!authenticatedAuthor) {
        throw new Error('Author identity is invalid for JWT generation');
    }

    return jwt.sign(
        {
            authorId: authenticatedAuthor._id,
            email: authenticatedAuthor.email
        },
        getJwtSecret(),
        { expiresIn: '1h' }
    );
};

export const verifyAccessToken = (token) => {
    return jwt.verify(token, getJwtSecret());
};
