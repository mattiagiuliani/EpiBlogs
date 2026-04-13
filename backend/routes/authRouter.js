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

const authRouter = Router();
const loginRateLimit = createLoginRateLimit();
const googleExchangeRateLimit = createGoogleExchangeRateLimit();
const meRateLimit = createMeRateLimit();

authRouter.post('/register', registerAuthor);
authRouter.post('/login', loginRateLimit, loginAuthor);
authRouter.post('/logout', logoutAuthor);
authRouter.get('/me', meRateLimit, requireAuthentication, getAuthenticatedAuthor);
authRouter.get('/google', startGoogleAuthentication);
authRouter.get('/google/callback', handleGoogleAuthenticationCallback);
authRouter.post('/google/exchange-code', googleExchangeRateLimit, exchangeGoogleAuthCode);

export default authRouter;
