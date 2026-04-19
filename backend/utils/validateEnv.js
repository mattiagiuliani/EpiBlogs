const REQUIRED_VARS = [
    'MONGODB_CONNECTION_URI',
    'JWT_SECRET_KEY'
];

const trimEnv = (value) => (typeof value === 'string' ? value.trim() : '');

const isProduction = process.env.NODE_ENV?.toLowerCase() === 'production' || process.env.GOOGLE_ENV?.toLowerCase() === 'production';

const isGoogleCallbackConfigured = () => [
    process.env.DEVELOPMENT_GOOGLE_CALLBACK_URL,
    process.env.DEPLOYMENT_GOOGLE_CALLBACK_URL
].some((value) => trimEnv(value));

const OPTIONAL_WITH_WARNINGS = [
    { key: isProduction ? 'DEPLOYMENT_FRONTEND_URL' : 'DEVELOPMENT_FRONTEND_URL', context: 'frontend redirects and CORS will fall back to localhost defaults' },
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
        replacement: 'none',
        reason: 'this variable is no longer read by the application; remove it from your environment'
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
            '(DEVELOPMENT_GOOGLE_CALLBACK_URL or DEPLOYMENT_GOOGLE_CALLBACK_URL) ' +
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

    const frontendUrlKey = isProduction ? 'DEPLOYMENT_FRONTEND_URL' : 'DEVELOPMENT_FRONTEND_URL';

    if (isProduction && !trimEnv(process.env[frontendUrlKey])) {
        log.error(
            { missing: [frontendUrlKey] },
            `${frontendUrlKey} is required in production for OAuth redirects and CORS. Exiting.`
        );
        process.exit(1);
    }
};