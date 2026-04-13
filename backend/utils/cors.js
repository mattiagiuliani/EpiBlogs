const DEFAULT_FRONTEND_URL = 'http://localhost:5173';

// Matches any *.vercel.app origin (e.g. branch preview deployments).
// Enabled only when CORS_ALLOW_VERCEL_PREVIEWS=true is set in the environment.
const VERCEL_PREVIEW_RE = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;

const trimEnv = (value) => (typeof value === 'string' ? value.trim() : '');

export const getAllowedCorsOrigins = () => {
    const configuredOrigins = trimEnv(process.env.CORS_ALLOWED_ORIGINS)
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    const frontendUrl = trimEnv(process.env.FRONTEND_URL) || DEFAULT_FRONTEND_URL;

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
