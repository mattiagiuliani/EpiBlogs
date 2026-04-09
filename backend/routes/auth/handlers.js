import Author from '../../models/Author.js';
import { consumeAuthCode, createAuthCode } from '../../utils/authExchange.js';
import { pickAuthorInput } from '../../utils/authorData.js';
import {
    buildFrontendAuthCallbackUrl,
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
import {
    sendAuthenticationPayload,
    sendGoogleOAuthUnavailable,
    sendInvalidGoogleAuthCode
} from './responseHelpers.js';
import { validateAuthBody } from './validators.js';
import passport from 'passport';
import { generateAccessToken } from '../../utils/jwt.js';

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
        console.log(error);
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

        sendAuthenticationPayload(response, author);
    } catch (error) {
        console.log(error);
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
    const state = createOAuthState();
    setOAuthStateCookie(response, state);

    passport.authenticate(getGoogleStrategyName(), {
        scope: ['email', 'profile'],
        session: false,
        state
    })(request, response, next);
};

export const handleGoogleAuthenticationCallback = (request, response, next) => {
    if (!isGoogleOAuthConfigured()) {
        clearOAuthStateCookie(response);
        return response.redirect(buildFrontendAuthCallbackUrl({ error: 'google_oauth_not_configured' }));
    }

    if (!isValidOAuthState(request)) {
        clearOAuthStateCookie(response);
        return response.redirect(buildFrontendAuthCallbackUrl({ error: 'google_state_mismatch' }));
    }

    ensureGoogleOAuthStrategy();

    passport.authenticate(getGoogleStrategyName(), { session: false }, async (error, author) => {
        clearOAuthStateCookie(response);

        if (error || !author) {
            console.log(error);
            return response.redirect(buildFrontendAuthCallbackUrl({ error: 'google_login_failed' }));
        }

        try {
            const token = generateAccessToken(author);
            const code = await createAuthCode({
                author: author.toJSON(),
                token
            });

            return response.redirect(buildFrontendAuthCallbackUrl({ code }));
        } catch (exchangeError) {
            console.log(exchangeError);
            return response.redirect(buildFrontendAuthCallbackUrl({ error: 'google_login_failed' }));
        }
    })(request, response, next);
};

export const exchangeGoogleAuthCode = async (request, response) => {
    const code = typeof request.body?.code === 'string'
        ? request.body.code.trim()
        : '';
    const authPayload = await consumeAuthCode(code);

    if (!authPayload) {
        return sendInvalidGoogleAuthCode(response);
    }

    return response.send(authPayload);
};
