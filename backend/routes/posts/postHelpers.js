import Author from '../../models/Author.js';
import Post from '../../models/Post.js';
import mailer from '../../middlewares/mailer.js';
import logger from '../../utils/logger.js';
import { isOwnedByAuthenticatedAuthor, sendForbiddenOwnershipError } from '../../utils/ownership.js';

const postNotFoundMessage = 'Post not found';
const authorNotFoundMessage = 'Author not found';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildPostFilter = (query = {}) => {
    const search = query.search ?? query.title ?? '';
    const filter = search
        ? { title: { $regex: escapeRegex(search), $options: 'i' } }
        : {};

    // Filter by slug, not by name — the frontend sends ?category=<slug>
    if (query.category) {
        filter.categorySlug = query.category;
    }

    // Backward compatible: supports both ?tag=... and ?tags=...
    // ?tag=ai or ?tag=ai,web-dev  →  OR logic via $in
    const rawTags = [query.tag, query.tags].filter(Boolean).join(',');
    if (rawTags) {
        const tags = [...new Set(String(rawTags)
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean))];
        if (tags.length > 0) {
            filter.tags = { $in: tags };
        }
    }

    return filter;
};

// Body-based filter for POST /api/v1/posts/search.
// Accepts a structured object instead of query-string params and uses MongoDB
// $text search (backed by the text index) instead of regex.
// The GET /posts filter (buildPostFilter) is deliberately left unchanged so
// the existing endpoint and all its tests remain fully backward compatible.
export const buildSearchFilter = (body = {}) => {
    const filter = {};

    // Full-text search via the { title: 'text', content: 'text' } index.
    if (body.search && String(body.search).trim()) {
        filter.$text = { $search: String(body.search).trim() };
    }

    if (body.categorySlug && String(body.categorySlug).trim()) {
        filter.categorySlug = String(body.categorySlug).trim();
    }

    if (Array.isArray(body.tags) && body.tags.length > 0) {
        const tags = body.tags.map(String).map((t) => t.trim()).filter(Boolean);
        if (tags.length > 0) {
            filter.tags = { $in: tags };
        }
    }

    return filter;
};

export const sendPostPublishedEmail = (author, post) => {
    return mailer.sendMail({
        from: process.env.MAIL_FROM?.trim() || process.env.MAIL_USER?.trim(),
        to: [author.email],
        subject: 'Your post has been published',
        text: `Hi ${author.firstName}, your new blog post "${post.title}" has been published.`,
        html: `<h1>Hi ${author.firstName}, your new blog post "${post.title}" has been published.</h1>`
    }).catch((error) => logger.error({ err: error }, 'Email send failed'));
};

export const findAuthorByIdOrRespond = async (authorId, response) => {
    const author = await Author.findById(authorId);

    if (!author) {
        response.status(404).send({ message: authorNotFoundMessage });
        return null;
    }

    return author;
};

export const findPostByIdOrRespond = async (postId, response, query = null) => {
    const postQuery = query ?? Post.findById(postId);
    const post = await postQuery;

    if (!post) {
        response.status(404).send({ message: postNotFoundMessage });
        return null;
    }

    return post;
};

export const findOwnedPostOrRespond = async (request, response, postId, forbiddenMessage) => {
    const post = await findPostByIdOrRespond(
        postId,
        response,
        Post.findById(postId).select('author')
    );

    if (!post) {
        return null;
    }

    if (!isOwnedByAuthenticatedAuthor(request, post.author)) {
        sendForbiddenOwnershipError(response, forbiddenMessage);
        return null;
    }

    return post;
};

