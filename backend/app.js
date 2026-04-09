import cors from 'cors';
import express from 'express';
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
app.use(express.json());
app.use(passport.initialize());

app.use(authentication);
app.use(authorRouter);
app.use(postRouter);
app.use(authRouter);

export default app;
