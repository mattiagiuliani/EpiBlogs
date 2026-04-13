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
        if (!origin) return callback(null, true);

        const allowed = [
            "http://localhost:5173",
            "https://epi-blogs.vercel.app"
        ];

        if (allowed.includes(origin) || origin.includes("vercel.app")) {
            return callback(null, true);
        }

        return callback(null, false);
    },
    credentials: true,
    methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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