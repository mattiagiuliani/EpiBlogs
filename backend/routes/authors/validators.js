import { isValidObjectId } from 'mongoose';

export const validateAuthorId = (authorId, response) => {
    if (!isValidObjectId(authorId)) {
        response.status(400).send({ message: 'Invalid authorId' });
        return false;
    }

    return true;
};

export const validatePassword = (password, response) => {
    if (typeof password !== 'string' || password.length < 6) {
        response.status(400).send({ message: 'Password must be at least 6 characters long' });
        return false;
    }

    return true;
};
