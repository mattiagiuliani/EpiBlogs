import Author from '../../models/Author.js';
import Post from '../../models/Post.js';
import mailer from '../../middlewares/mailer.js';
import { isOwnedByAuthenticatedAuthor, sendForbiddenOwnershipError } from '../../utils/ownership.js';

const postNotFoundMessage = 'Post not found';
const authorNotFoundMessage = 'Author not found';

export const buildPostFilter = (query = {}) => {
    const search = query.search ?? query.title ?? '';

    return search
        ? { title: { $regex: search, $options: 'i' } }
        : {};
};

export const sendPostPublishedEmail = (author, post) => {
    return mailer.sendMail({
        from: process.env.MAIL_FROM?.trim() || process.env.MAIL_USER?.trim(),
        to: [author.email],
        subject: 'Your post has been published',
        text: `Hi ${author.firstName}, your new blog post "${post.title}" has been published.`,
        html: `<h1>Hi ${author.firstName}, your new blog post "${post.title}" has been published.</h1>`
    }).catch((error) => console.log('Email send failed:', error));
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

export const hydratePostAuthorUpdate = async (updateData, response) => {
    if (!updateData.author) {
        return updateData;
    }

    const author = await findAuthorByIdOrRespond(updateData.author, response);

    if (!author) {
        return null;
    }

    return {
        ...updateData,
        author: author._id,
        authorEmail: author.email
    };
};
