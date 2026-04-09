const DEFAULT_FRONTEND_URL = 'http://localhost:5173';

const trimEnv = (value) => (typeof value === 'string' ? value.trim() : '');

export const getAllowedCorsOrigins = () => {
    const configuredOrigins = trimEnv(process.env.CORS_ALLOWED_ORIGINS)
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    const frontendUrl = trimEnv(process.env.FRONTEND_URL) || DEFAULT_FRONTEND_URL;

    return Array.from(new Set([
        frontendUrl,
        ...configuredOrigins
    ]));
};

export const buildCorsOptions = () => {
    const allowedOrigins = getAllowedCorsOrigins();
    const allowCredentials = trimEnv(process.env.CORS_ALLOW_CREDENTIALS) === 'true';

    return {
        allowedHeaders: ['Authorization', 'Content-Type'],
        credentials: allowCredentials,
        maxAge: 60 * 60 * 24,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        optionsSuccessStatus: 204,
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(null, false);
        }
    };
};
