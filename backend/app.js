import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import passport from 'passport';
import apiRouter from './routes/apiRouter.js';
import authentication from './middlewares/authentication.js';

const app = express();

app.disable('x-powered-by');

// ─────────────────────────────────────────────
// TRUST PROXY (Render / production safe)
// ─────────────────────────────────────────────
const trustProxySetting = process.env.TRUST_PROXY?.trim();
if (trustProxySetting) {
    app.set('trust proxy', trustProxySetting);
}

// ─────────────────────────────────────────────
// CORS CONFIG (SINGLE SOURCE OF TRUTH)
// ─────────────────────────────────────────────
const allowedOrigins = [
    process.env.FRONTEND_URL, // production (Render env)
    "https://epi-blogs.vercel.app",
    "http://localhost:5173"
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // allow tools like Postman / server-to-server
        if (!origin) return callback(null, true);

        if (
            allowedOrigins.includes(origin) ||
            origin.includes("vercel.app")
        ) {
            return callback(null, true);
        }

        return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

// ─────────────────────────────────────────────
// APPLY MIDDLEWARES
// ─────────────────────────────────────────────
app.use(cors(corsOptions));

// IMPORTANT: preflight handler
app.options('*', cors(corsOptions));

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(express.json({ limit: '100kb' }));
app.use(passport.initialize());

// ─────────────────────────────────────────────
// HEALTH CHECK (Render debug)
// ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// ─────────────────────────────────────────────
// AUTH + API ROUTES
// ─────────────────────────────────────────────
app.use(authentication);
app.use('/api/v1', apiRouter);

export default app;