import { Router } from 'express';
import { createGoogleExchangeRateLimit, createLoginRateLimit } from '../middlewares/rateLimit.js';
import {
    exchangeGoogleAuthCode,
    getAuthenticatedAuthor,
    handleGoogleAuthenticationCallback,
    loginAuthor,
    registerAuthor,
    startGoogleAuthentication
} from './auth/handlers.js';
import {
    googleAuthPaths,
    googleCallbackPaths,
    googleExchangePaths,
    loginPaths,
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
