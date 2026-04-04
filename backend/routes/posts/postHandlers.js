import Author from '../../models/Author.js';
import Post from '../../models/Post.js';
import mailer from '../../middlewares/mailer.js';
import { sendValidationError } from '../../utils/routeErrors.js';
import { validateAuthorId, validatePostId } from './validators.js';

const sendPostPublishedEmail = (author, post) => {
    return mailer.sendMail({
        from: process.env.MAIL_FROM?.trim() || process.env.MAIL_USER?.trim(),
        to: [author.email],
        subject: 'Your post has been published',
        text: `Hi ${author.firstName}, your new blog post "${post.title}" has been published.`,
        html: `<h1>Hi ${author.firstName}, your new blog post "${post.title}" has been published.</h1>`
    }).catch((error) => console.log('Email send failed:', error));
};

export const listPosts = async (request, response) => {
    try {
        const search = request.query.search ?? request.query.title ?? '';
        const filter = search
            ? { title: { $regex: search, $options: 'i' } }
            : {};

        const posts = await Post.find(filter).lean();
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

        const post = await Post.findById(request.params.postId).lean();

        if (!post) {
            return response.status(404).send({ message: 'Post not found' });
        }

        response.send(post);
    } catch (error) {
        console.log(error);
        response.status(500).send({ message: error.message });
    }
};

export const createPost = async (request, response) => {
    try {
        if (!validateAuthorId(request.body.author, response)) {
            return;
        }

        const author = await Author.findById(request.body.author);

        if (!author) {
            return response.status(404).send({ message: 'Author not found' });
        }

        const newPost = await Post.create({
            category: request.body.category,
            title: request.body.title,
            cover: request.body.cover,
            readTime: request.body.readTime,
            author: author._id,
            authorEmail: author.email,
            content: request.body.content
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

        const updateData = { ...request.body };

        if (updateData.author) {
            if (!validateAuthorId(updateData.author, response)) {
                return;
            }

            const author = await Author.findById(updateData.author);

            if (!author) {
                return response.status(404).send({ message: 'Author not found' });
            }

            updateData.author = author._id;
            updateData.authorEmail = author.email;
        }

        const postModified = await Post.findByIdAndUpdate(
            request.params.postId,
            updateData,
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

        const author = await Author.findById(request.params.authorId);

        if (!author) {
            return response.status(404).send({ message: 'Author not found' });
        }

        const posts = await Post.find({ author: request.params.authorId }).lean();
        response.send(posts);
    } catch (error) {
        console.log(error);
        response.status(500).send({ message: error.message });
    }
};
