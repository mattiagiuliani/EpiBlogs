import { Router } from 'express';
import { getAuthenticatedAuthor, loginAuthor, registerAuthor } from './auth/handlers.js';
import { loginPaths, mePaths, registerPaths } from './auth/paths.js';

const authRouter = Router();

registerPaths.forEach((path) => {
    authRouter.post(path, registerAuthor);
});

loginPaths.forEach((path) => {
    authRouter.post(path, loginAuthor);
});

mePaths.forEach((path) => {
    authRouter.get(path, getAuthenticatedAuthor);
});

export default authRouter;
