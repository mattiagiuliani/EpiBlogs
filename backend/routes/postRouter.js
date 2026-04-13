import { Router } from 'express';
import { requireAuthentication } from '../middlewares/authentication.js';
import uploadCloudinary from '../middlewares/uploadCloudinary.js';
import {
    createComment,
    deleteComment,
    getSingleComment,
    listComments,
    updateComment
} from './posts/commentHandlers.js';
import {
    createPost,
    deletePost,
    getPostById,
    listPosts,
    updatePost,
    updatePostCover
} from './posts/postHandlers.js';

const postRouter = Router();

postRouter.get('/', listPosts);
postRouter.get('/:postId', getPostById);
postRouter.post('/', requireAuthentication, createPost);
postRouter.patch('/:postId/cover', requireAuthentication, uploadCloudinary.single('cover'), updatePostCover);
postRouter.put('/:postId', requireAuthentication, updatePost);
postRouter.delete('/:postId', requireAuthentication, deletePost);

const commentsBase = '/:postId/comments';
const commentItem = `${commentsBase}/:commentId`;

postRouter.get(commentsBase, listComments);
postRouter.get(commentItem, getSingleComment);
postRouter.post(commentsBase, requireAuthentication, createComment);
postRouter.put(commentItem, requireAuthentication, updateComment);
postRouter.delete(commentItem, requireAuthentication, deleteComment);

export default postRouter;
