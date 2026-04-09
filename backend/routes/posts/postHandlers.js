import Post from '../../models/Post.js';
import { isOwnedByAuthenticatedAuthor, sendForbiddenOwnershipError } from '../../utils/ownership.js';
import { pickPostInput } from '../../utils/postData.js';
import { sendValidationError } from '../../utils/routeErrors.js';
import {
    buildPostFilter,
    findAuthorByIdOrRespond,
    findOwnedPostOrRespond,
    findPostByIdOrRespond,
    hydratePostAuthorUpdate,
    sendPostPublishedEmail
} from './postHelpers.js';
import { validateAuthorId, validatePostId } from './validators.js';

export const listPosts = async (request, response) => {
    try {
        const posts = await Post.find(buildPostFilter(request.query)).lean();
        response.send(posts);
    } catch (error) {
        console.log(error);
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
        console.log(error);
        response.status(500).send({ message: error.message });
    }
};

export const createPost = async (request, response) => {
    try {
        const postData = pickPostInput(request.body);

        if (!validateAuthorId(postData.author, response)) {
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
        console.log(error);
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
            { new: true }
        );

        if (!postModified) {
            return response.status(404).send({ message: 'Post not found' });
        }

        response.send(postModified);
    } catch (error) {
        console.log(error);
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

        if (updateData.author) {
            if (!validateAuthorId(updateData.author, response)) {
                return;
            }
        }

        const hydratedUpdateData = await hydratePostAuthorUpdate(updateData, response);

        if (!hydratedUpdateData) {
            return;
        }

        const postModified = await Post.findByIdAndUpdate(
            request.params.postId,
            hydratedUpdateData,
            { new: true, runValidators: true }
        );

        if (!postModified) {
            return response.status(404).send({ message: 'Post not found' });
        }

        response.send(postModified);
    } catch (error) {
        console.log(error);
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
        console.log(error);
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
        console.log(error);
        response.status(500).send({ message: error.message });
    }
};
