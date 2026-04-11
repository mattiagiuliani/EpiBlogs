import Post from '../../models/Post.js';
import logger from '../../utils/logger.js';
import { isOwnedByAuthenticatedAuthor, sendForbiddenOwnershipError } from '../../utils/ownership.js';
import {
    validateCommentBody,
    validateCommentId,
    validatePostId
} from './validators.js';

// Fetches only the matching comment subdocument using the positional projection.
const findPostWithComment = async (postId, commentId) => {
    return Post.findOne(
        { _id: postId, 'comments._id': commentId },
        { 'comments.$': 1 }
    );
};

export const listComments = async (request, response) => {
    try {
        const postId = request.params.postId ?? request.params.id;

        if (!validatePostId(postId, response)) {
            return;
        }

        const post = await Post.findById(postId).select('comments').lean();

        if (!post) {
            return response.status(404).send({ message: 'Post not found' });
        }

        response.send(post.comments);
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};

export const getSingleComment = async (request, response) => {
    try {
        const postId = request.params.postId ?? request.params.id;
        const { commentId } = request.params;

        if (!validatePostId(postId, response) || !validateCommentId(commentId, response)) {
            return;
        }

        const post = await findPostWithComment(postId, commentId);

        if (!post) {
            return response.status(404).send({ message: 'Post not found' });
        }

        const comment = post.comments[0];

        if (!comment) {
            return response.status(404).send({ message: 'Comment not found' });
        }

        response.send(comment);
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};

export const createComment = async (request, response) => {
    try {
        const postId = request.params.postId ?? request.params.id;

        if (!validatePostId(postId, response) || !validateCommentBody(request, response)) {
            return;
        }

        const post = await Post.findById(postId);

        if (!post) {
            return response.status(404).send({ message: 'Post not found' });
        }

        post.comments.push({
            author: request.author._id,
            comment: request.body.comment.trim()
        });
        await post.save();

        response.status(201).send(post.comments[post.comments.length - 1]);
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};

export const updateComment = async (request, response) => {
    try {
        const postId = request.params.postId ?? request.params.id;
        const { commentId } = request.params;

        if (
            !validatePostId(postId, response)
            || !validateCommentId(commentId, response)
            || !validateCommentBody(request, response)
        ) {
            return;
        }

        // Fetch only the matching comment to check ownership before writing.
        const postWithComment = await findPostWithComment(postId, commentId);

        if (!postWithComment) {
            return response.status(404).send({ message: 'Comment not found' });
        }

        const comment = postWithComment.comments[0];

        if (!isOwnedByAuthenticatedAuthor(request, comment.author)) {
            return sendForbiddenOwnershipError(response, 'You can update only your own comments');
        }

        // Targeted update — only the matched comment's text is rewritten.
        const updatedPost = await Post.findOneAndUpdate(
            { _id: postId, 'comments._id': commentId },
            { $set: { 'comments.$.comment': request.body.comment.trim() } },
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            return response.status(404).send({ message: 'Post not found' });
        }

        response.send(updatedPost.comments.id(commentId));
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};

export const deleteComment = async (request, response) => {
    try {
        const postId = request.params.postId ?? request.params.id;
        const { commentId } = request.params;

        if (!validatePostId(postId, response) || !validateCommentId(commentId, response)) {
            return;
        }

        // Fetch only the matching comment to check ownership before writing.
        const postWithComment = await findPostWithComment(postId, commentId);

        if (!postWithComment) {
            return response.status(404).send({ message: 'Comment not found' });
        }

        const comment = postWithComment.comments[0];

        if (!isOwnedByAuthenticatedAuthor(request, comment.author)) {
            return sendForbiddenOwnershipError(response, 'You can delete only your own comments');
        }

        // Targeted removal — only pulls the specific comment subdocument.
        await Post.findByIdAndUpdate(
            postId,
            { $pull: { comments: { _id: commentId } } }
        );

        response.send({ message: 'Comment deleted' });
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};
