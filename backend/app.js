import cors from 'cors';
import express from 'express';
import authRouter from './routes/authRouter.js';
import authorRouter from './routes/authorRouter.js';
import postRouter from './routes/postRouter.js';
import authentication from './middlewares/authentication.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use(authentication);
app.use(authorRouter);
app.use(postRouter);
app.use(authRouter);

export default app;
