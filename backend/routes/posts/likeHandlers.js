import Post from '../../models/Post.js';
import PostLike from '../../models/PostLike.js';
import logger from '../../utils/logger.js';
import { validatePostId } from './validators.js';

/**
 * GET /:postId/likes
 * Public. Returns { count, likedByMe }.
 * likedByMe is true only when the request carries a verified author session.
 */
export const getLikes = async (request, response) => {
    try {
        const postId = request.params.postId;

        if (!validatePostId(postId, response)) return;

        const postExists = await Post.exists({ _id: postId });
        if (!postExists) {
            return response.status(404).send({ message: 'Post not found' });
        }

        const count = await PostLike.countDocuments({ post: postId });

        const authorId = request.author?._id ?? null;
        const likedByMe = authorId
            ? !!(await PostLike.exists({ post: postId, author: authorId }))
            : false;

        response.send({ count, likedByMe });
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};

/**
 * POST /:postId/likes
 * Requires authentication. Toggles the like for the authenticated author.
 * Returns { count, likedByMe } after the toggle.
 */
export const toggleLike = async (request, response) => {
    try {
        const postId = request.params.postId;

        if (!validatePostId(postId, response)) return;

        const postExists = await Post.exists({ _id: postId });
        if (!postExists) {
            return response.status(404).send({ message: 'Post not found' });
        }

        const authorId = request.author._id;

        const existing = await PostLike.findOne({ post: postId, author: authorId });

        if (existing) {
            await PostLike.deleteOne({ _id: existing._id });
        } else {
            await PostLike.create({ post: postId, author: authorId });
        }

        const count = await PostLike.countDocuments({ post: postId });
        const likedByMe = !existing; // flipped from what we found

        response.send({ count, likedByMe });
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};
