import { normalizeEmail } from './authorData.js';

const normalizeId = (value) => {
    if (!value) {
        return '';
    }

    if (typeof value === 'string') {
        return value;
    }

    if (typeof value.toString === 'function') {
        return value.toString();
    }

    return '';
};

export const toAuthenticatedAuthor = (author) => {
    const _id = normalizeId(author?._id);
    const email = normalizeEmail(author?.email);

    if (!_id || typeof email !== 'string' || !email) {
        return null;
    }

    return { _id, email };
};

export const normalizeAuthorId = normalizeId;
