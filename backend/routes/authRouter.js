import { Router } from 'express';
import { createGoogleExchangeRateLimit, createLoginRateLimit } from '../middlewares/rateLimit.js';
import {
    exchangeGoogleAuthCode,
    getAuthenticatedAuthor,
    handleGoogleAuthenticationCallback,
    loginAuthor,
    logoutAuthor,
    registerAuthor,
    startGoogleAuthentication
} from './auth/handlers.js';
import {
    googleAuthPaths,
    googleCallbackPaths,
    googleExchangePaths,
    loginPaths,
    logoutPaths,
    mePaths,
    registerPaths
} from './auth/paths.js';

const authRouter = Router();
const loginRateLimit = createLoginRateLimit();
const googleExchangeRateLimit = createGoogleExchangeRateLimit();

registerPaths.forEach((path) => {
    authRouter.post(path, registerAuthor);
});

loginPaths.forEach((path) => {
    authRouter.post(path, loginRateLimit, loginAuthor);
});

logoutPaths.forEach((path) => {
    authRouter.post(path, logoutAuthor);
});

// GET /auth/logout — convenience alias requested for client-side navigation links.
// Note: GET-based logout is safe here because the session is an HttpOnly SameSite cookie
// (not a URL token), so CSRF-logout only causes a minor UX inconvenience, not data exposure.
authRouter.get('/auth/logout', logoutAuthor);

mePaths.forEach((path) => {
    authRouter.get(path, getAuthenticatedAuthor);
});

googleAuthPaths.forEach((path) => {
    authRouter.get(path, startGoogleAuthentication);
});

googleCallbackPaths.forEach((path) => {
    authRouter.get(path, handleGoogleAuthenticationCallback);
});

googleExchangePaths.forEach((path) => {
    authRouter.post(path, googleExchangeRateLimit, exchangeGoogleAuthCode);
});

export default authRouter;
