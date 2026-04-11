import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import passport from 'passport';
import authRouter from './routes/authRouter.js';
import { buildCorsOptions } from './utils/cors.js';
import authorRouter from './routes/authorRouter.js';
import postRouter from './routes/postRouter.js';
import authentication from './middlewares/authentication.js';

const app = express();

const trustProxySetting = process.env.TRUST_PROXY?.trim();

app.disable('x-powered-by');

if (trustProxySetting) {
  app.set('trust proxy', trustProxySetting);
}

app.use(cors(buildCorsOptions()));
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

app.use(authentication);
app.use(authorRouter);
app.use(postRouter);
app.use(authRouter);

export default app;
