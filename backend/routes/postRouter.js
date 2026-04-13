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
    listPostsByAuthor,
    updatePost,
    updatePostCover
} from './posts/postHandlers.js';

const postRouter = Router();

postRouter.get('/api/v1/posts', listPosts);
postRouter.get('/api/v1/posts/:postId', getPostById);
postRouter.post('/api/v1/posts', requireAuthentication, createPost);
postRouter.patch('/api/v1/posts/:postId/cover', requireAuthentication, uploadCloudinary.single('cover'), updatePostCover);
postRouter.put('/api/v1/posts/:postId', requireAuthentication, updatePost);
postRouter.delete('/api/v1/posts/:postId', requireAuthentication, deletePost);
postRouter.get('/api/v1/authors/:authorId/posts', listPostsByAuthor);

const commentsBase = '/api/v1/posts/:postId/comments';
const commentItem = `${commentsBase}/:commentId`;

postRouter.get(commentsBase, listComments);
postRouter.get(commentItem, getSingleComment);
postRouter.post(commentsBase, requireAuthentication, createComment);
postRouter.put(commentItem, requireAuthentication, updateComment);
postRouter.delete(commentItem, requireAuthentication, deleteComment);

export default postRouter;
