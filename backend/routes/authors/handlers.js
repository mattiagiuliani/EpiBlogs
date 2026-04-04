import Author from '../../models/Author.js';
import mailer from '../../middlewares/mailer.js';
import { withNormalizedEmail } from '../../utils/authorData.js';
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
    }).catch((error) => console.log('Email send failed:', error));
};

export const listAuthors = async (_request, response) => {
    try {
        const authors = await Author.find({}).lean();
        response.send(authors);
    } catch (error) {
        console.log(error);
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
        console.log(error);
        response.status(500).send({ message: error.message });
    }
};

export const createAuthor = async (request, response) => {
    try {
        const authorData = withNormalizedEmail(request.body);

        if (!validatePassword(authorData.password, response)) {
            return;
        }

        authorData.password = await hashPassword(authorData.password);

        const newAuthor = await Author.create(authorData);
        sendWelcomeEmail(newAuthor);

        response.status(201).send(newAuthor);
    } catch (error) {
        console.log(error);
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
        console.log(error);
        response.status(500).send({ message: error.message });
    }
};

export const updateAuthor = async (request, response) => {
    try {
        if (!validateAuthorId(request.params.authorId, response)) {
            return;
        }

        const updateData = withNormalizedEmail(request.body);

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
        console.log(error);
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

        const authorDeleted = await Author.findByIdAndDelete(request.params.authorId);

        if (!authorDeleted) {
            return response.status(404).send({ message: 'Author not found' });
        }

        response.send({ message: 'author deleted' });
    } catch (error) {
        console.log(error);
        response.status(500).send({ message: error.message });
    }
};
