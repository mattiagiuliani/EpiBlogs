import Author from '../../models/Author.js';
import mailer from '../../middlewares/mailer.js';
import logger from '../../utils/logger.js';
import { pickAuthorInput } from '../../utils/authorData.js';
import { isOwnedByAuthenticatedAuthor, sendForbiddenOwnershipError } from '../../utils/ownership.js';
import { hashPassword } from '../../utils/passwords.js';
import { sendDuplicateKeyError, sendValidationError } from '../../utils/routeErrors.js';
import { validateAuthorId, validatePassword } from './validators.js';

const sendWelcomeEmail = (author) => {
    const authorName = author.firstName ?? 'user';

    return mailer.sendMail({
        from: process.env.MAIL_FROM?.trim() || process.env.MAIL_USER?.trim(),
        to: [author.email],
        subject: 'Welcome to our platform',
        text: `Thank you for joining us, ${authorName}!`,
        html: `<h1>Thank you for joining us, ${authorName}!</h1>`
    }).catch((error) => logger.error({ err: error }, 'Email send failed'));
};

export const listAuthors = async (request, response) => {
    try {
        const limit = Math.min(Math.max(Number(request.query.limit) || 20, 1), 100);
        const page = Math.max(Number(request.query.page) || 1, 1);
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            Author.find({}).skip(skip).limit(limit).lean(),
            Author.countDocuments({})
        ]);

        response.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};

export const getAuthorById = async (request, response) => {
    try {
        if (!validateAuthorId(request.params.authorId, response)) {
            return;
        }

        const author = await Author.findById(request.params.authorId).lean();

        if (!author) {
            return response.status(404).send({ message: 'Author not found' });
        }

        response.send(author);
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};

export const createAuthor = async (request, response) => {
    try {
        const authorData = pickAuthorInput(request.body);

        if (!validatePassword(authorData.password, response)) {
            return;
        }

        authorData.password = await hashPassword(authorData.password);

        const newAuthor = await Author.create(authorData);
        sendWelcomeEmail(newAuthor);

        response.status(201).send(newAuthor);
    } catch (error) {
        logger.error({ err: error });
        if (sendValidationError(error, response)) {
            return;
        }
        if (sendDuplicateKeyError(error, response)) {
            return;
        }
        response.status(500).send({ message: error.message });
    }
};

export const updateAuthorAvatar = async (request, response) => {
    try {
        if (!validateAuthorId(request.params.authorId, response)) {
            return;
        }

        if (!isOwnedByAuthenticatedAuthor(request, request.params.authorId)) {
            return sendForbiddenOwnershipError(response, 'You can update only your own author profile');
        }

        if (!request.file) {
            return response.status(400).send({ message: 'Avatar file is required' });
        }

        const authorModified = await Author.findByIdAndUpdate(
            request.params.authorId,
            { avatar: request.file.path },
            { new: true }
        );

        if (!authorModified) {
            return response.status(404).send({ message: 'Author not found' });
        }

        response.send(authorModified);
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};

export const updateAuthor = async (request, response) => {
    try {
        if (!validateAuthorId(request.params.authorId, response)) {
            return;
        }

        if (!isOwnedByAuthenticatedAuthor(request, request.params.authorId)) {
            return sendForbiddenOwnershipError(response, 'You can update only your own author profile');
        }

        const updateData = pickAuthorInput(request.body);

        if (typeof updateData.password === 'string') {
            if (!validatePassword(updateData.password, response)) {
                return;
            }

            updateData.password = await hashPassword(updateData.password);
        }

        const authorModified = await Author.findByIdAndUpdate(
            request.params.authorId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!authorModified) {
            return response.status(404).send({ message: 'Author not found' });
        }

        response.send(authorModified);
    } catch (error) {
        logger.error({ err: error });
        if (sendValidationError(error, response)) {
            return;
        }
        if (sendDuplicateKeyError(error, response)) {
            return;
        }
        response.status(500).send({ message: error.message });
    }
};

export const deleteAuthor = async (request, response) => {
    try {
        if (!validateAuthorId(request.params.authorId, response)) {
            return;
        }

        if (!isOwnedByAuthenticatedAuthor(request, request.params.authorId)) {
            return sendForbiddenOwnershipError(response, 'You can delete only your own author profile');
        }

        const authorDeleted = await Author.findByIdAndDelete(request.params.authorId);

        if (!authorDeleted) {
            return response.status(404).send({ message: 'Author not found' });
        }

        response.send({ message: 'author deleted' });
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};
