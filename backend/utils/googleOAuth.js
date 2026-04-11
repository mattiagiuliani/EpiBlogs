import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import Author from '../models/Author.js';

const GOOGLE_STRATEGY_NAME = 'google';
let isGoogleStrategyInitialized = false;

const trimEnv = (value) => (typeof value === 'string' ? value.trim() : '');

// Selects the callback URL based on NODE_ENV:
//   production  → DEPLOYMENT_GOOGLE_CALLBACK_URL  (e.g. https://epiblogs-mxl1.onrender.com/auth/google/callback)
//   development → DEVELOPMENT_GOOGLE_CALLBACK_URL (e.g. http://localhost:3000/auth/google/callback)
// Falls back to the legacy GOOGLE_CALLBACK_URL when neither split var is set so
// existing .env files continue to work without modification.
export const getCallbackUrl = () => {
    const isProduction = process.env.NODE_ENV === 'production';

    return isProduction
        ? trimEnv(process.env.DEPLOYMENT_GOOGLE_CALLBACK_URL) || trimEnv(process.env.GOOGLE_CALLBACK_URL)
        : trimEnv(process.env.DEVELOPMENT_GOOGLE_CALLBACK_URL) || trimEnv(process.env.GOOGLE_CALLBACK_URL);
};

export const isGoogleOAuthConfigured = () => Boolean(
    trimEnv(process.env.GOOGLE_CLIENT_ID) &&
    trimEnv(process.env.GOOGLE_CLIENT_SECRET) &&
    getCallbackUrl()
);

const getGoogleOAuthConfig = () => {
    const clientID = trimEnv(process.env.GOOGLE_CLIENT_ID);
    const clientSecret = trimEnv(process.env.GOOGLE_CLIENT_SECRET);
    const callbackURL = getCallbackUrl();

    if (!clientID || !clientSecret || !callbackURL) {
        throw new Error('Google OAuth is not fully configured');
    }

    return {
        callbackURL,
        clientID,
        clientSecret
    };
};

const normalizeGoogleProfile = (profile) => {
    const email = profile.emails?.[0]?.value?.trim().toLowerCase();

    if (!email) {
        throw new Error('Google account email is not available');
    }

    return {
        avatar: profile.photos?.[0]?.value?.trim() || undefined,
        email,
        firstName: profile.name?.givenName?.trim() || 'Google',
        googleId: profile.id,
        lastName: profile.name?.familyName?.trim() || undefined
    };
};

const syncGoogleAuthor = async (googleProfile) => {
    const normalizedProfile = normalizeGoogleProfile(googleProfile);
    let author = await Author.findOne({
        $or: [
            { googleId: normalizedProfile.googleId },
            { email: normalizedProfile.email }
        ]
    });

    if (!author) {
        author = await Author.create(normalizedProfile);
        return author;
    }

    author.googleId = normalizedProfile.googleId;
    author.firstName = author.firstName || normalizedProfile.firstName;
    author.lastName = author.lastName || normalizedProfile.lastName;
    author.avatar = author.avatar || normalizedProfile.avatar;

    await author.save();
    return author;
};

export const ensureGoogleOAuthStrategy = () => {
    if (!isGoogleOAuthConfigured() || isGoogleStrategyInitialized) {
        return;
    }

    passport.use(new GoogleStrategy(
        {
            ...getGoogleOAuthConfig()
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                const author = await syncGoogleAuthor(profile);
                done(null, author);
            } catch (error) {
                done(error);
            }
        }
    ));

    isGoogleStrategyInitialized = true;
};

export const getGoogleStrategyName = () => GOOGLE_STRATEGY_NAME;

export const getFrontendAppUrl = () => trimEnv(process.env.FRONTEND_URL) || 'http://localhost:5173';

export const buildFrontendAuthCallbackUrl = ({ code, error } = {}) => {
    const callbackUrl = new URL('/auth/callback', getFrontendAppUrl());

    if (code) {
        callbackUrl.searchParams.set('code', code);
    }

    if (error) {
        callbackUrl.searchParams.set('error', error);
    }

    return callbackUrl.toString();
};
