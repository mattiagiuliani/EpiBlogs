const REQUIRED_VARS = [
    'MONGODB_CONNECTION_URI',
    'JWT_SECRET_KEY'
];

const OPTIONAL_WITH_WARNINGS = [
    { key: 'CLOUDINARY_CLOUD_NAME', context: 'file uploads' },
    { key: 'CLOUDINARY_API_KEY', context: 'file uploads' },
    { key: 'CLOUDINARY_API_SECRET', context: 'file uploads' },
    { key: 'MAIL_HOST', context: 'email delivery' },
    { key: 'MAIL_USER', context: 'email delivery' },
    { key: 'GOOGLE_CLIENT_ID', context: 'Google OAuth' },
    { key: 'GOOGLE_CLIENT_SECRET', context: 'Google OAuth' }
];

// Checks that at least one Google callback URL variant is configured.
// Accepted names (in priority order per environment):
//   Production  → DEPLOYMENT_GOOGLE_CALLBACK_URL, then GOOGLE_CALLBACK_URL
//   Development → DEVELOPMENT_GOOGLE_CALLBACK_URL, then GOOGLE_CALLBACK_URL
const isGoogleCallbackConfigured = () => [
    process.env.DEVELOPMENT_GOOGLE_CALLBACK_URL,
    process.env.DEPLOYMENT_GOOGLE_CALLBACK_URL,
    process.env.GOOGLE_CALLBACK_URL
].some((v) => typeof v === 'string' && v.trim());

export const validateEnv = (log) => {
    const missing = REQUIRED_VARS.filter(
        (key) => !process.env[key]?.trim()
    );

    if (missing.length > 0) {
        log.error({ missing }, 'Missing required environment variables. Exiting.');
        process.exit(1);
    }

    OPTIONAL_WITH_WARNINGS.forEach(({ key, context }) => {
        if (!process.env[key]?.trim()) {
            log.warn(`${key} is not set — ${context} will be unavailable`);
        }
    });

    if (!isGoogleCallbackConfigured()) {
        log.warn(
            'No Google OAuth callback URL is set ' +
            '(DEVELOPMENT_GOOGLE_CALLBACK_URL, DEPLOYMENT_GOOGLE_CALLBACK_URL, or GOOGLE_CALLBACK_URL) ' +
            '— Google OAuth will be unavailable'
        );
    }
};
