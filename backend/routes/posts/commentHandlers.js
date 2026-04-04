import Post from '../../models/Post.js';
import {
    validateCommentBody,
    validateCommentId,
    validatePostId
} from './validators.js';

const getPostById = async (postId) => Post.findById(postId);
const getCommentById = (post, commentId) => post.comments.id(commentId);

export const listComments = async (request, response) => {
    try {
        const postId = request.params.postId ?? request.params.id;

        if (!validatePostId(postId, response)) {
            return;
        }

        const post = await getPostById(postId);

        if (!post) {
            return response.status(404).send({ message: 'Post not found' });
        }

        response.send(post.comments);
    } catch (error) {
        console.log(error);
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

        const post = await getPostById(postId);

        if (!post) {
            return response.status(404).send({ message: 'Post not found' });
        }

        const comment = getCommentById(post, commentId);

        if (!comment) {
            return response.status(404).send({ message: 'Comment not found' });
        }

        response.send(comment);
    } catch (error) {
        console.log(error);
        response.status(500).send({ message: error.message });
    }
};

export const createComment = async (request, response) => {
    try {
        const postId = request.params.postId ?? request.params.id;

        if (!validatePostId(postId, response) || !validateCommentBody(request, response)) {
            return;
        }

        const post = await getPostById(postId);

        if (!post) {
            return response.status(404).send({ message: 'Post not found' });
        }

        post.comments.push({ comment: request.body.comment.trim() });
        await post.save();

        response.status(201).send(post.comments[post.comments.length - 1]);
    } catch (error) {
        console.log(error);
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

        const post = await getPostById(postId);

        if (!post) {
            return response.status(404).send({ message: 'Post not found' });
        }

        const comment = getCommentById(post, commentId);

        if (!comment) {
            return response.status(404).send({ message: 'Comment not found' });
        }

        comment.comment = request.body.comment.trim();
        await post.save();

        response.send(comment);
    } catch (error) {
        console.log(error);
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

        const post = await getPostById(postId);

        if (!post) {
            return response.status(404).send({ message: 'Post not found' });
        }

        const comment = getCommentById(post, commentId);

        if (!comment) {
            return response.status(404).send({ message: 'Comment not found' });
        }

        comment.deleteOne();
        await post.save();

        response.send({ message: 'Comment deleted' });
    } catch (error) {
        console.log(error);
        response.status(500).send({ message: error.message });
    }
};
