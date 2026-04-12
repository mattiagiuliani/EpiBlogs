const REQUIRED_VARS = [
    'MONGODB_CONNECTION_URI',
    'JWT_SECRET_KEY'
];

const OPTIONAL_WITH_WARNINGS = [
    { key: 'FRONTEND_URL', context: 'frontend redirects and CORS will fall back to localhost defaults' },
    { key: 'CLOUDINARY_CLOUD_NAME', context: 'file uploads' },
    { key: 'CLOUDINARY_API_KEY', context: 'file uploads' },
    { key: 'CLOUDINARY_API_SECRET', context: 'file uploads' },
    { key: 'MAIL_HOST', context: 'email delivery' },
    { key: 'MAIL_USER', context: 'email delivery' },
    { key: 'GOOGLE_CLIENT_ID', context: 'Google OAuth' },
    { key: 'GOOGLE_CLIENT_SECRET', context: 'Google OAuth' }
];

const DEPRECATED_VARS = [
    {
        key: 'BACKEND_HOST',
        replacement: 'none',
        reason: 'the backend no longer reads this value'
    },
    {
        key: 'GOOGLE_CALLBACK_URL',
        replacement: 'DEVELOPMENT_GOOGLE_CALLBACK_URL / DEPLOYMENT_GOOGLE_CALLBACK_URL',
        reason: 'split callback URLs are the documented source of truth'
    },
    {
        key: 'JWT_SECRET',
        replacement: 'JWT_SECRET_KEY',
        reason: 'JWT_SECRET is kept only as a backward-compatible alias'
    },
    {
        key: 'OAUTH_COOKIE_SECURE',
        replacement: 'AUTH_COOKIE_SECURE',
        reason: 'AUTH_COOKIE_SECURE is the canonical cookie security flag'
    }
];

const trimEnv = (value) => (typeof value === 'string' ? value.trim() : '');

const isGoogleCallbackConfigured = () => [
    process.env.DEVELOPMENT_GOOGLE_CALLBACK_URL,
    process.env.DEPLOYMENT_GOOGLE_CALLBACK_URL,
    process.env.GOOGLE_CALLBACK_URL
].some((value) => trimEnv(value));

export const validateEnv = (log) => {
    const missing = REQUIRED_VARS.filter((key) => !trimEnv(process.env[key]));

    if (missing.length > 0) {
        log.error({ missing }, 'Missing required environment variables. Exiting.');
        process.exit(1);
    }

    OPTIONAL_WITH_WARNINGS.forEach(({ key, context }) => {
        if (!trimEnv(process.env[key])) {
            log.warn(`${key} is not set — ${context}`);
        }
    });

    if (!isGoogleCallbackConfigured()) {
        log.warn(
            'No Google OAuth callback URL is set ' +
            '(DEVELOPMENT_GOOGLE_CALLBACK_URL, DEPLOYMENT_GOOGLE_CALLBACK_URL, or GOOGLE_CALLBACK_URL) ' +
            '— Google OAuth will be unavailable'
        );
    }

    DEPRECATED_VARS.forEach(({ key, replacement, reason }) => {
        if (trimEnv(process.env[key])) {
            log.warn(`${key} is deprecated${replacement !== 'none' ? `; use ${replacement} instead` : ''} — ${reason}`);
        }
    });

    const sameSite = trimEnv(process.env.AUTH_COOKIE_SAME_SITE).toLowerCase();
    const secure = trimEnv(process.env.AUTH_COOKIE_SECURE).toLowerCase();

    if (sameSite === 'none' && secure === 'false') {
        log.warn('AUTH_COOKIE_SAME_SITE=none with AUTH_COOKIE_SECURE=false is unsafe and can break browser cookie delivery');
    }

    if (process.env.NODE_ENV === 'production' && !trimEnv(process.env.FRONTEND_URL)) {
        log.warn('FRONTEND_URL should be set in production so OAuth redirects and CORS match the deployed frontend');
    }
};
