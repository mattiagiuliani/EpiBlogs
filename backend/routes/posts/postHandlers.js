import Category from '../../models/Category.js';
import Post from '../../models/Post.js';
import logger from '../../utils/logger.js';
import { isOwnedByAuthenticatedAuthor, sendForbiddenOwnershipError } from '../../utils/ownership.js';
import { normalizeTags, pickPostInput } from '../../utils/postData.js';
import { sendValidationError } from '../../utils/routeErrors.js';
import {
    buildPostFilter,
    buildSearchFilter,
    findAuthorByIdOrRespond,
    findOwnedPostOrRespond,
    findPostByIdOrRespond,
    sendPostPublishedEmail
} from './postHelpers.js';
import { validateAuthorId, validatePostBody, validatePostId } from './validators.js';

// Resolve a Category document by name OR slug.
// Returns { name, slug } if found, null otherwise.
// This allows the frontend to send either form without server-side breakage.
const resolveCategoryFields = async (categoryInput) => {
    if (!categoryInput) return null;
    try {
        return await Category.findOne({
            $or: [{ name: categoryInput }, { slug: categoryInput }]
        }).lean();
    } catch {
        return null;
    }
};

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

export const listPostTags = async (request, response) => {
    try {
        const limit = Math.min(Math.max(Number(request.query.limit) || 50, 1), 100);
        
        // Aggregation pipeline: group by tag, count occurrences, filter invalid, sort by count DESC
        const data = await Post.aggregate([
            { $unwind: '$tags' },
            { $match: { tags: { $nin: [null, undefined, '', 'undefined', 'null'] } } },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $project: { tag: '$_id', count: 1, _id: 0 } },
            { $sort: { count: -1, tag: 1 } },
            { $limit: limit }
        ]);

        response.send({ data });
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};

// POST /api/v1/posts/search
// Body-driven search using the MongoDB text index (title + content).
// Accepts { search?, categorySlug?, tags? } and returns the same paginated
// envelope as GET /posts. Pagination is still controlled via query params
// (?page=&limit=) so callers can bookmark result pages.
export const searchPosts = async (request, response) => {
    try {
        const limit = Math.min(Math.max(Number(request.query.limit) || 20, 1), 100);
        const page = Math.max(Number(request.query.page) || 1, 1);
        const skip = (page - 1) * limit;
        const filter = buildSearchFilter(request.body);

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

        const categoryDoc = await resolveCategoryFields(postData.category);

        const newPost = await Post.create({
            category: categoryDoc?.name ?? postData.category,
            categorySlug: categoryDoc?.slug,
            tags: normalizeTags(postData.tags),
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

        const coverUrl = request.file.secure_url || request.file.url || request.file.path;
        if (!coverUrl) {
            return response.status(500).send({ message: 'Unable to resolve uploaded cover URL' });
        }

        const postModified = await Post.findByIdAndUpdate(
            request.params.postId,
            { cover: coverUrl },
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

        // Normalize category: if category was provided (as name or slug),
        // resolve it to its canonical name + slug from the Category collection.
        if (updateData.category) {
            const categoryDoc = await resolveCategoryFields(updateData.category);
            if (categoryDoc) {
                updateData.category = categoryDoc.name;
                updateData.categorySlug = categoryDoc.slug;
            }
        }

        // Normalize tags if provided; an explicit empty array clears all tags.
        if (Object.hasOwn(updateData, 'tags')) {
            updateData.tags = normalizeTags(updateData.tags);
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
