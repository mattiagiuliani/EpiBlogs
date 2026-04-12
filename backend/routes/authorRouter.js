import { Router } from 'express';
import { requireAuthentication } from '../middlewares/authentication.js';
import uploadCloudinary from '../middlewares/uploadCloudinary.js';
import {
    createAuthor,
    deleteAuthor,
    getAuthorById,
    listAuthors,
    updateAuthor,
    updateAuthorAvatar
} from './authors/handlers.js';

const authorRouter = Router();

authorRouter.get('/api/v1/authors', listAuthors);
authorRouter.get('/api/v1/authors/:authorId', getAuthorById);
authorRouter.post('/authors', createAuthor);
authorRouter.post('/api/v1/authors', createAuthor);
authorRouter.patch('/api/v1/authors/:authorId/avatar', requireAuthentication, uploadCloudinary.single('avatar'), updateAuthorAvatar);
authorRouter.put('/api/v1/authors/:authorId', requireAuthentication, updateAuthor);
authorRouter.delete('/api/v1/authors/:authorId', requireAuthentication, deleteAuthor);

export default authorRouter;
