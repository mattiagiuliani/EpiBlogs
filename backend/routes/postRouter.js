import { Router } from 'express';
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
postRouter.post('/api/v1/posts', createPost);
postRouter.patch('/api/v1/posts/:postId/cover', uploadCloudinary.single('cover'), updatePostCover);
postRouter.put('/api/v1/posts/:postId', updatePost);
postRouter.delete('/api/v1/posts/:postId', deletePost);
postRouter.get('/api/v1/authors/:authorId/posts', listPostsByAuthor);

[
    '/api/v1/posts/:postId',
    '/blogPosts/:id'
].forEach((basePath) => {
    const commentsPath = `${basePath}/comments`;
    const commentPath = `${commentsPath}/:commentId`;
    const legacyCommentPath = `${basePath}/comment/:commentId`;

    postRouter.get(commentsPath, listComments);
    postRouter.get(commentPath, getSingleComment);
    postRouter.post(commentsPath, createComment);
    postRouter.put(commentPath, updateComment);
    postRouter.put(legacyCommentPath, updateComment);
    postRouter.delete(commentPath, deleteComment);
    postRouter.delete(legacyCommentPath, deleteComment);
});

export default postRouter;
