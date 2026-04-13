import { Router } from 'express';
import authRouter from './authRouter.js';
import authorRouter from './authorRouter.js';
import postRouter from './postRouter.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/authors', authorRouter);
apiRouter.use('/posts', postRouter);

export default apiRouter;
