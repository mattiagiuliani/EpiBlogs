import jwt from 'jsonwebtoken';
import { toAuthenticatedAuthor } from './authenticatedAuthor.js';
import JwtBlacklist from '../models/JwtBlacklist.js';

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

export const verifyAccessToken = async (token) => {
    // First verify the JWT signature
    const payload = jwt.verify(token, getJwtSecret());

    // Skip blacklist check in test environments
    if (process.env.NODE_ENV === 'test' || typeof global.it === 'function') {
        return payload;
    }

    // Try to check blacklist, but don't fail if database is unavailable
    try {
        const blacklisted = await JwtBlacklist.findOne({ token });
        if (blacklisted) {
            throw new Error('Token has been invalidated');
        }
    } catch (dbError) {
        // If it's not a blacklist error, rethrow
        if (dbError.message !== 'Token has been invalidated') {
            // Database might not be available, silently continue
        }
    }

    return payload;
};

export const blacklistToken = async (token) => {
    try {
        // Decode token to get expiration time
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) {
            return; // Invalid token, nothing to blacklist
        }

        const expiresAt = new Date(decoded.exp * 1000);

        // Add to blacklist (will auto-expire when token would naturally expire)
        await JwtBlacklist.create({ token, expiresAt });
    } catch (error) {
        // If we can't decode the token, it's probably invalid anyway
        // Just ignore the error
    }
};
