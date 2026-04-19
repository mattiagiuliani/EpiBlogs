import Author from '../../models/Author.js';
import logger from '../../utils/logger.js';
import { getFrontendAppUrl } from '../../utils/googleOAuth.js';
import { consumeAuthCode, createAuthCode } from '../../utils/authExchange.js';
import { clearAuthCookie, readAuthCookie, setAuthCookie } from '../../utils/authCookie.js';
import { toAuthenticatedAuthor } from '../../utils/authenticatedAuthor.js';
import { pickAuthorInput } from '../../utils/authorData.js';
import {
    ensureGoogleOAuthStrategy,
    getGoogleStrategyName,
    isGoogleOAuthConfigured
} from '../../utils/googleOAuth.js';
import {
    clearOAuthStateCookie,
    createOAuthState,
    isValidOAuthState,
    setOAuthStateCookie
} from '../../utils/oauthState.js';
import { hashPassword, verifyPassword } from '../../utils/passwords.js';
import { sendDuplicateKeyError, sendValidationError } from '../../utils/routeErrors.js';
import { generateAccessToken } from '../../utils/jwt.js';
import {
    sendAuthenticationPayload,
    sendGoogleOAuthUnavailable,
    sendInvalidGoogleAuthCode
} from './responseHelpers.js';
import { validateAuthBody } from './validators.js';
import passport from 'passport';
import { blacklistToken } from '../../utils/jwt.js';

export const registerAuthor = async (request, response) => {
    try {
        const authorData = pickAuthorInput(request.body);

        if (!validateAuthBody({ body: authorData }, response)) {
            return;
        }

        const passHash = await hashPassword(authorData.password);

        const newAuthor = await Author.create({
            ...authorData,
            password: passHash
        });

        response.status(201).send(newAuthor);
    } catch (error) {
        logger.error({ err: error });
        if (sendValidationError(error, response)) {
            return;
        }
        if (sendDuplicateKeyError(error, response)) {
            return;
        }
        response.status(500).send({ message: error.message });
    }
};

export const loginAuthor = async (request, response) => {
    try {
        const authBody = pickAuthorInput(request.body);

        if (!validateAuthBody({ body: authBody }, response)) {
            return;
        }

        const { email, password } = authBody;
        const author = await Author.findOne({ email }).select('+password');

        if (!author || !(await verifyPassword(password, author.password))) {
            return response.status(401).send({ message: 'Invalid credentials' });
        }

        // Clear any existing auth state to ensure clean login
        clearAuthCookie(response);

        sendAuthenticationPayload(response, author);
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};

export const getAuthenticatedAuthor = async (request, response) => {
    response.send(request.author);
};

export const startGoogleAuthentication = (request, response, next) => {
    if (!isGoogleOAuthConfigured()) {
        sendGoogleOAuthUnavailable(response);
        return;
    }

    ensureGoogleOAuthStrategy();

    // Clear any existing OAuth state to ensure fresh start
    clearOAuthStateCookie(response);

    const state = createOAuthState();
    setOAuthStateCookie(response, state);

    passport.authenticate(getGoogleStrategyName(), {
        scope: ['email', 'profile'],
        session: false,
        state,
        prompt: 'consent'  // Force fresh consent on every login attempt
    })(request, response, next);
};

export const handleGoogleAuthenticationCallback = (request, response, next) => {
    if (!isGoogleOAuthConfigured()) {
        clearOAuthStateCookie(response);
        return response.redirect(
            getFrontendAppUrl() + '/auth/callback?error=google_oauth_not_configured'
        );
    }

    if (!isValidOAuthState(request)) {
        clearOAuthStateCookie(response);
        return response.redirect(
            getFrontendAppUrl() + '/auth/callback?error=google_state_mismatch'
        );
    }

    ensureGoogleOAuthStrategy();

    passport.authenticate(getGoogleStrategyName(), { session: false }, async (error, author) => {
        clearOAuthStateCookie(response);

        if (error || !author) {
            logger.error({ err: error });
            return response.redirect(
                getFrontendAppUrl() + '/auth/callback?error=google_login_failed'
            );
        }

        try {
            clearAuthCookie(response);

            const token = generateAccessToken(author);
            const code = await createAuthCode({
                author: toAuthenticatedAuthor(author),
                token
            });

            return response.redirect(
                getFrontendAppUrl() + `/auth/callback?code=${code}`
            );
        } catch (exchangeError) {
            logger.error({ err: exchangeError });
            return response.redirect(
                getFrontendAppUrl() + '/auth/callback?error=google_login_failed'
            );
        }
    })(request, response, next);
};

export const exchangeGoogleAuthCode = async (request, response) => {
    try {
        const { code } = request.body;

        if (!code) {
            return response.status(400).send({ message: 'Code is required' });
        }

        const payload = await consumeAuthCode(code);

        if (!payload) {
            return response.status(400).send({ message: 'Google auth code is invalid or expired' });
        }

        const { author, token } = payload;

        setAuthCookie(response, token);

        response.send({
            token,
            author: toAuthenticatedAuthor(author)
        });
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};

export const logoutAuthor = async (request, response) => {
    try {
        const token = readAuthCookie(request);

        if (token) {
            await blacklistToken(token);
        }

        clearAuthCookie(response);

        response.send({ message: 'Logged out successfully' });
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};