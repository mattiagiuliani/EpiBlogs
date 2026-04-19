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
import { getLikes, toggleLike } from './posts/likeHandlers.js';
import {
    createPost,
    deletePost,
    getPostById,
    listPostTags,
    listPosts,
    searchPosts,
    updatePost,
    updatePostCover
} from './posts/postHandlers.js';

const postRouter = Router();

postRouter.get('/', listPosts);
postRouter.get('/tags', listPostTags);
// /search must be declared before /:postId so Express doesn't treat
// the literal string "search" as a postId parameter.
postRouter.post('/search', searchPosts);
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

postRouter.get('/:postId/likes', getLikes);
postRouter.post('/:postId/likes', requireAuthentication, toggleLike);

export default postRouter;
