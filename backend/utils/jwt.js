import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET_KEY?.trim();

    if (!secret) {
        throw new Error('JWT_SECRET_KEY is not configured');
    }

    return secret;
};

export const generateAccessToken = (author) => {
    return jwt.sign(
        {
            authorId: author._id.toString(),
            email: author.email
        },
        getJwtSecret(),
        { expiresIn: '1h' }
    );
};

export const verifyAccessToken = (token) => {
    return jwt.verify(token, getJwtSecret());
};
