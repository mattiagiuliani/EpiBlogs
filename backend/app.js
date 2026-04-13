import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import passport from 'passport';
import apiRouter from './routes/apiRouter.js';
import { buildCorsOptions } from './utils/cors.js';
import authentication from './middlewares/authentication.js';

const app = express();

const trustProxySetting = process.env.TRUST_PROXY?.trim();

app.disable('x-powered-by');

if (trustProxySetting) {
    app.set('trust proxy', trustProxySetting);
}

// Build CORS options once so both the preflight handler and the regular
// middleware share the exact same origin whitelist.
const corsOptions = buildCorsOptions();

// Explicit OPTIONS handler must come before every other middleware.
// This guarantees that preflight requests receive CORS headers and a 204
// response before helmet, body-parser, or authentication can run and
// potentially omit or overwrite the Access-Control-Allow-Origin header.
app.options('*', cors(corsOptions));

app.use(cors(corsOptions));

// Helmet sets secure HTTP response headers. Content-Security-Policy and
// Cross-Origin-Embedder-Policy are disabled because this is a JSON API (no
// HTML), and crossOriginResourcePolicy is set to cross-origin to allow the
// frontend to read API responses across origins.
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(express.json({ limit: '100kb' }));
app.use(passport.initialize());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(authentication);
app.use('/api/v1', apiRouter);

export default app;
