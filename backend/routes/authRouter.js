import { Router } from 'express';
import { requireAuthentication } from '../middlewares/authentication.js';
import { createGoogleExchangeRateLimit, createLoginRateLimit, createMeRateLimit } from '../middlewares/rateLimit.js';
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
const meRateLimit = createMeRateLimit();

registerPaths.forEach((path) => {
    authRouter.post(path, registerAuthor);
});

loginPaths.forEach((path) => {
    authRouter.post(path, loginRateLimit, loginAuthor);
});

logoutPaths.forEach((path) => {
    authRouter.post(path, logoutAuthor);
});

mePaths.forEach((path) => {
    authRouter.get(path, meRateLimit, requireAuthentication, getAuthenticatedAuthor);
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
