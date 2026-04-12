import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import Author from '../models/Author.js';

const GOOGLE_STRATEGY_NAME = 'google';
let isGoogleStrategyInitialized = false;

const trimEnv = (value) =>
    typeof value === 'string' ? value.trim() : '';

export const getCallbackUrl = () => {
    const isProduction = process.env.NODE_ENV === 'production';

    const url = isProduction
        ? process.env.DEPLOYMENT_GOOGLE_CALLBACK_URL
        : process.env.DEVELOPMENT_GOOGLE_CALLBACK_URL;

    return trimEnv(url);
};

export const isGoogleOAuthConfigured = () => {
    return Boolean(
        trimEnv(process.env.GOOGLE_CLIENT_ID) &&
        trimEnv(process.env.GOOGLE_CLIENT_SECRET) &&
        getCallbackUrl()
    );
};

const getGoogleOAuthConfig = () => {
    const clientID = trimEnv(process.env.GOOGLE_CLIENT_ID);
    const clientSecret = trimEnv(process.env.GOOGLE_CLIENT_SECRET);
    const callbackURL = getCallbackUrl();

    if (!clientID || !clientSecret || !callbackURL) {
        throw new Error('[Google OAuth] Missing configuration');
    }

    return {
        clientID,
        clientSecret,
        callbackURL,
    };
};

const normalizeGoogleProfile = (profile) => {
    const email = profile.emails?.[0]?.value?.trim().toLowerCase();

    if (!email) {
        throw new Error('Google profile missing email');
    }

    return {
        email,
        googleId: profile.id,
        firstName: profile.name?.givenName?.trim() || 'Google',
        lastName: profile.name?.familyName?.trim() || undefined,
        avatar: profile.photos?.[0]?.value?.trim() || undefined,
    };
};

const applyProfileUpdates = (author, profile) => {
    let changed = false;

    if (!author.firstName && profile.firstName) {
        author.firstName = profile.firstName;
        changed = true;
    }

    if (!author.lastName && profile.lastName) {
        author.lastName = profile.lastName;
        changed = true;
    }

    if (!author.avatar && profile.avatar) {
        author.avatar = profile.avatar;
        changed = true;
    }

    return changed;
};

export const syncGoogleAuthor = async (googleProfile) => {
    const profile = normalizeGoogleProfile(googleProfile);

    let author = await Author.findOne({ email: profile.email }).select('+googleId');

    if (author) {
        let changed = applyProfileUpdates(author, profile);

        if (!author.googleId) {
            author.googleId = profile.googleId;
            changed = true;
        }

        if (changed) await author.save();

        return author;
    }

    author = await Author.findOne({ googleId: profile.googleId }).select('+googleId');

    if (author) {
        const changed = applyProfileUpdates(author, profile);
        if (changed) await author.save();

        return author;
    }

    return Author.create(profile);
};

export const ensureGoogleOAuthStrategy = () => {
    if (!isGoogleOAuthConfigured() || isGoogleStrategyInitialized) return;

    passport.use(
        GOOGLE_STRATEGY_NAME,
        new GoogleStrategy(
            getGoogleOAuthConfig(),
            async (_accessToken, _refreshToken, profile, done) => {
                try {
                    const author = await syncGoogleAuthor(profile);
                    done(null, author);
                } catch (err) {
                    done(err);
                }
            }
        )
    );

    isGoogleStrategyInitialized = true;
};

export const getGoogleStrategyName = () => GOOGLE_STRATEGY_NAME;

export const getFrontendAppUrl = () =>
    trimEnv(process.env.FRONTEND_URL) || 'http://localhost:5173';


// ⚠️ FIX IMPORTANTE QUI SOTTO
export const buildFrontendAuthCallbackUrl = ({ code, error } = {}) => {
    const baseUrl = getFrontendAppUrl();

    // avoid double slash bugs
    const callbackUrl = new URL('/auth/callback', baseUrl);

    if (code) callbackUrl.searchParams.set('code', code);
    if (error) callbackUrl.searchParams.set('error', error);

    return callbackUrl.toString();
};
