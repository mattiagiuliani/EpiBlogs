export const DEFAULT_FRONTEND_URL = 'http://localhost:5173';

// Matches any *.vercel.app origin (e.g. branch preview deployments).
// Enabled only when CORS_ALLOW_VERCEL_PREVIEWS=true is set in the environment.
const VERCEL_PREVIEW_RE = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;

const trimEnv = (value) => (typeof value === 'string' ? value.trim() : '');
const LOCALHOST_DEV_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const isProductionEnv = () =>
    process.env.NODE_ENV?.toLowerCase() === 'production' ||
    process.env.GOOGLE_ENV?.toLowerCase() === 'production';

export const resolveFrontendUrl = () => {
    const explicitFrontendUrl = trimEnv(process.env.FRONTEND_URL);
    if (explicitFrontendUrl) return explicitFrontendUrl;

    const envFrontendUrl = trimEnv(
        isProductionEnv()
            ? process.env.DEPLOYMENT_FRONTEND_URL
            : process.env.DEVELOPMENT_FRONTEND_URL
    );

    return envFrontendUrl || DEFAULT_FRONTEND_URL;
};

export const hasConfiguredFrontendUrl = () =>
    Boolean(
        trimEnv(process.env.FRONTEND_URL) ||
        trimEnv(process.env.DEVELOPMENT_FRONTEND_URL) ||
        trimEnv(process.env.DEPLOYMENT_FRONTEND_URL)
    );

export const getAllowedCorsOrigins = () => {
    const configuredOrigins = trimEnv(process.env.CORS_ALLOWED_ORIGINS)
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    const frontendUrl = resolveFrontendUrl();

    return Array.from(new Set([
        frontendUrl,
        ...configuredOrigins,
    ]));
};

export const buildCorsOptions = () => {
    const allowedOrigins = getAllowedCorsOrigins();
    const credentialsSetting = trimEnv(process.env.CORS_ALLOW_CREDENTIALS);
    const allowCredentials = credentialsSetting === '' ? true : credentialsSetting === 'true';
    const allowVercelPreviews = trimEnv(process.env.CORS_ALLOW_VERCEL_PREVIEWS) === 'true';
    const allowLocalhostDevOrigins = !isProductionEnv();

    return {
        allowedHeaders: ['Authorization', 'Content-Type'],
        credentials: allowCredentials,
        maxAge: 60 * 60 * 24,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        optionsSuccessStatus: 204,
        origin(requestOrigin, callback) {
            const isAllowed =
                !requestOrigin ||
                allowedOrigins.includes(requestOrigin) ||
                (allowLocalhostDevOrigins && LOCALHOST_DEV_RE.test(requestOrigin)) ||
                (allowVercelPreviews && VERCEL_PREVIEW_RE.test(requestOrigin));

            if (isAllowed) {
                callback(null, true);
                return;
            }

            // Log rejected origins so Render/production logs make the mismatch visible.
            console.warn(
                `[CORS] rejected origin: "${requestOrigin}"` +
                ` | whitelist: ${JSON.stringify(allowedOrigins)}` +
                (allowVercelPreviews ? ' | vercel-previews: enabled' : '')
            );
            callback(null, false);
        },
    };
};
