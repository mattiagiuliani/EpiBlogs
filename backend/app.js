import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import passport from 'passport';
import apiRouter from './routes/apiRouter.js';
import authentication from './middlewares/authentication.js';

const app = express();

const isProduction = process.env.NODE_ENV?.toLowerCase() === 'production' || process.env.GOOGLE_ENV?.toLowerCase() === 'production';

const frontendUrlKey = isProduction ? 'DEPLOYMENT_FRONTEND_URL' : 'DEVELOPMENT_FRONTEND_URL';

const trustProxySetting = process.env.TRUST_PROXY?.trim();

app.disable('x-powered-by');

if (trustProxySetting) {
    app.set('trust proxy', trustProxySetting);
}

const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:5173',
            ...(process.env[frontendUrlKey] ? [process.env[frontendUrlKey].trim()] : []),
            ...(process.env.CORS_ALLOWED_ORIGINS
                ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
                : []),
        ];

        if (!origin) return callback(null, true);

        if (
            allowedOrigins.includes(origin) ||
            (process.env.CORS_ALLOW_VERCEL_PREVIEWS === 'true' &&
                /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin))
        ) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

// 1. CORS headers on every request (must be first)
app.use(cors(corsOptions));

// 2. Explicit preflight handler — always responds 204 before any other
//    middleware (helmet, body-parser, authentication) can interfere
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.sendStatus(204);
    }
    next();
});

// 3. Helmet (after CORS so it does not interfere with Allow-Origin)
//
// Single helmet() call — splitting into helmet.contentSecurityPolicy() +
// helmet() causes the second call to overwrite the CSP with Helmet defaults.
const isDevelopment = !isProduction;
const frontendUrl = process.env[frontendUrlKey]?.trim();

// Gstatic hosts: www.gstatic.com serves Google OAuth UI assets (inline styles,
// icons); fonts.gstatic.com serves the actual font files. Both are required.
const GSTATIC = ['https://www.gstatic.com', 'https://fonts.gstatic.com'];

const styleSrc = [
    "'self'",
    "'unsafe-inline'",       // Google OAuth injects inline styles at runtime
    'https://fonts.googleapis.com',
    ...GSTATIC,
];

const connectSrc = [
    "'self'",
    'https://accounts.google.com',
    'https://oauth2.googleapis.com',
    'https://www.googleapis.com',
    ...(isDevelopment ? ['http://localhost:3000', 'http://localhost:5173'] : []),
    ...(frontendUrl && !isDevelopment ? [frontendUrl] : []),
];

app.use(helmet({
    // Disable COEP — Google OAuth iframes are cross-origin and would be
    // blocked by the stricter require-corp policy.
    crossOriginEmbedderPolicy: false,
    // Allow cross-origin reads so Google OAuth resources load correctly.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
        directives: {
            defaultSrc:       ["'self'"],
            scriptSrc:        [
                "'self'",
                'https://accounts.google.com',  // GSI script + OAuth popup
                'https://apis.google.com',       // Google platform library
                ...(isDevelopment ? ["'unsafe-eval'"] : []),  // Vite HMR
            ],
            styleSrc,
            styleSrcElem:     styleSrc,          // Chrome enforces this separately
            fontSrc:          ["'self'", ...GSTATIC, 'https://fonts.googleapis.com'],
            imgSrc:           ["'self'", 'data:', 'https://*.googleusercontent.com'],
            connectSrc,
            frameSrc:         ["'self'", 'https://accounts.google.com', 'https://*.google.com'],
            objectSrc:        ["'none'"],
            baseUri:          ["'self'"],
            formAction:       ["'self'"],
            frameAncestors:   ["'self'"],
            // Only upgrade insecure requests in production (would break local HTTP dev)
            ...(isDevelopment ? {} : { upgradeInsecureRequests: [] }),
        },
    },
}));

// 4. Body parsing
app.use(express.json({ limit: '100kb' }));

// 5. Passport
app.use(passport.initialize());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 6. Authentication (after CORS + OPTIONS so it never blocks preflight)
app.use(authentication);

// 7. API routes
app.use('/api/v1', apiRouter);

export default app;
