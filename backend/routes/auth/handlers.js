import Author from '../../models/Author.js';
import { withNormalizedEmail } from '../../utils/authorData.js';
import { generateAccessToken } from '../../utils/jwt.js';
import { hashPassword, verifyPassword } from '../../utils/passwords.js';
import { sendDuplicateKeyError, sendValidationError } from '../../utils/routeErrors.js';
import { validateAuthBody } from './validators.js';

export const registerAuthor = async (request, response) => {
    try {
        if (!validateAuthBody(request, response)) {
            return;
        }

        const authorData = withNormalizedEmail(request.body);
        const passHash = await hashPassword(authorData.password);

        const newAuthor = await Author.create({
            ...authorData,
            password: passHash
        });

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

export const loginAuthor = async (request, response) => {
    try {
        if (!validateAuthBody(request, response)) {
            return;
        }

        const { email, password } = withNormalizedEmail(request.body);
        const author = await Author.findOne({ email }).select('+password');

        if (!author || !(await verifyPassword(password, author.password))) {
            return response.status(401).send({ message: 'Invalid credentials' });
        }

        const token = generateAccessToken(author);

        response.send({
            token,
            author: author.toJSON()
        });
    } catch (error) {
        console.log(error);
        response.status(500).send({ message: error.message });
    }
};

export const getAuthenticatedAuthor = async (request, response) => {
    response.send(request.author);
};
