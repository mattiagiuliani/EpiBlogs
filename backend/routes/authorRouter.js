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
import { listPostsByAuthor } from './posts/postHandlers.js';

const authorRouter = Router();

authorRouter.get('/', listAuthors);
authorRouter.get('/:authorId', getAuthorById);
authorRouter.post('/', createAuthor);
authorRouter.patch('/:authorId/avatar', requireAuthentication, uploadCloudinary.single('avatar'), updateAuthorAvatar);
authorRouter.put('/:authorId', requireAuthentication, updateAuthor);
authorRouter.delete('/:authorId', requireAuthentication, deleteAuthor);
authorRouter.get('/:authorId/posts', listPostsByAuthor);

export default authorRouter;
