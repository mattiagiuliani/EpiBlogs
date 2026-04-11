import { setAuthCookie } from '../../utils/authCookie.js';
import { generateAccessToken } from '../../utils/jwt.js';

export const sendAuthenticationPayload = (response, author) => {
    const token = generateAccessToken(author);

    setAuthCookie(response, token);

    response.send({
        token,
        author: author.toJSON()
    });
};

export const sendGoogleOAuthUnavailable = (response) => {
    response.status(503).send({ message: 'Google OAuth is not configured' });
};

export const sendInvalidGoogleAuthCode = (response) => {
    response.status(400).send({ message: 'Google auth code is invalid or expired' });
};
