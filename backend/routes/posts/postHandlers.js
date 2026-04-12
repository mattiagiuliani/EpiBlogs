import Post from '../../models/Post.js';
import logger from '../../utils/logger.js';
import { isOwnedByAuthenticatedAuthor, sendForbiddenOwnershipError } from '../../utils/ownership.js';
import { pickPostInput } from '../../utils/postData.js';
import { sendValidationError } from '../../utils/routeErrors.js';
import {
    buildPostFilter,
    findAuthorByIdOrRespond,
    findOwnedPostOrRespond,
    findPostByIdOrRespond,
    sendPostPublishedEmail
} from './postHelpers.js';
import { validateAuthorId, validatePostBody, validatePostId } from './validators.js';

export const listPosts = async (request, response) => {
    try {
        const limit = Math.min(Math.max(Number(request.query.limit) || 20, 1), 100);
        const page = Math.max(Number(request.query.page) || 1, 1);
        const skip = (page - 1) * limit;
        const filter = buildPostFilter(request.query);

        const [data, total] = await Promise.all([
            Post.find(filter).skip(skip).limit(limit).lean(),
            Post.countDocuments(filter)
        ]);

        response.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};

export const getPostById = async (request, response) => {
    try {
        if (!validatePostId(request.params.postId, response)) {
            return;
        }

        const post = await findPostByIdOrRespond(
            request.params.postId,
            response,
            Post.findById(request.params.postId).lean()
        );

        if (!post) {
            return;
        }

        response.send(post);
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};

export const createPost = async (request, response) => {
    try {
        const postData = pickPostInput(request.body);

        if (!validateAuthorId(postData.author, response) || !validatePostBody(postData, response)) {
            return;
        }

        if (!isOwnedByAuthenticatedAuthor(request, postData.author)) {
            return sendForbiddenOwnershipError(response, 'You can create posts only for your own author profile');
        }

        const author = await findAuthorByIdOrRespond(postData.author, response);

        if (!author) {
            return;
        }

        const newPost = await Post.create({
            category: postData.category,
            title: postData.title,
            cover: postData.cover,
            readTime: postData.readTime,
            author: author._id,
            authorEmail: author.email,
            content: postData.content
        });

        sendPostPublishedEmail(author, newPost);
        response.status(201).send(newPost);
    } catch (error) {
        logger.error({ err: error });
        if (sendValidationError(error, response)) {
            return;
        }
        response.status(500).send({ message: error.message });
    }
};

export const updatePostCover = async (request, response) => {
    try {
        if (!validatePostId(request.params.postId, response)) {
            return;
        }

        const existingPost = await findOwnedPostOrRespond(
            request,
            response,
            request.params.postId,
            'You can update only your own posts'
        );

        if (!existingPost) {
            return;
        }

        if (!request.file) {
            return response.status(400).send({ message: 'Cover file is required' });
        }

        const postModified = await Post.findByIdAndUpdate(
            request.params.postId,
            { cover: request.file.path },
            { returnDocument: 'after', runValidators: true }
        );

        if (!postModified) {
            return response.status(404).send({ message: 'Post not found' });
        }

        response.send(postModified);
    } catch (error) {
        logger.error({ err: error });
        if (sendValidationError(error, response)) {
            return;
        }
        response.status(500).send({ message: error.message });
    }
};

export const updatePost = async (request, response) => {
    try {
        if (!validatePostId(request.params.postId, response)) {
            return;
        }

        const existingPost = await findOwnedPostOrRespond(
            request,
            response,
            request.params.postId,
            'You can update only your own posts'
        );

        if (!existingPost) {
            return;
        }

        const updateData = pickPostInput(request.body);
        // Post ownership cannot be transferred: strip author so a user cannot
        // reassign their post to another author profile.
        delete updateData.author;

        if (!validatePostBody(updateData, response, { partial: true })) {
            return;
        }

        const postModified = await Post.findByIdAndUpdate(
            request.params.postId,
            updateData,
            { returnDocument: 'after', runValidators: true }
        );

        if (!postModified) {
            return response.status(404).send({ message: 'Post not found' });
        }

        response.send(postModified);
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};

export const deletePost = async (request, response) => {
    try {
        if (!validatePostId(request.params.postId, response)) {
            return;
        }

        const existingPost = await findOwnedPostOrRespond(
            request,
            response,
            request.params.postId,
            'You can delete only your own posts'
        );

        if (!existingPost) {
            return;
        }

        const postDeleted = await Post.findByIdAndDelete(request.params.postId);

        if (!postDeleted) {
            return response.status(404).send({ message: 'Post not found' });
        }

        response.send({ message: 'post deleted' });
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};

export const listPostsByAuthor = async (request, response) => {
    try {
        if (!validateAuthorId(request.params.authorId, response)) {
            return;
        }

        const author = await findAuthorByIdOrRespond(request.params.authorId, response);

        if (!author) {
            return;
        }

        const posts = await Post.find({ author: request.params.authorId }).lean();
        response.send(posts);
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};
