import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import passport from 'passport';
import apiRouter from './routes/apiRouter.js';
import authentication from './middlewares/authentication.js';

const app = express();

const trustProxySetting = process.env.TRUST_PROXY?.trim();

app.disable('x-powered-by');

if (trustProxySetting) {
    app.set('trust proxy', trustProxySetting);
}

const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:5173',
            ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim()] : []),
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
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
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
