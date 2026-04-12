import { isValidObjectId } from 'mongoose';

export const validatePostId = (postId, response) => {
    if (!isValidObjectId(postId)) {
        response.status(400).send({ message: 'Invalid postId' });
        return false;
    }

    return true;
};

export const validateAuthorId = (authorId, response) => {
    if (!isValidObjectId(authorId)) {
        response.status(400).send({ message: 'Invalid authorId' });
        return false;
    }

    return true;
};

export const validateCommentId = (commentId, response) => {
    if (!isValidObjectId(commentId)) {
        response.status(400).send({ message: 'Invalid commentId' });
        return false;
    }

    return true;
};

export const validateCommentBody = (request, response) => {
    if (typeof request.body.comment !== 'string' || !request.body.comment?.trim()) {
        response.status(400).send({ message: 'Comment is required' });
        return false;
    }

    return true;
};

export const validatePostBody = (postData, response, { partial = false } = {}) => {
    const requireField = (condition, message) => {
        if (!condition) {
            response.status(400).send({ message });
            return false;
        }

        return true;
    };

    if (!partial || Object.hasOwn(postData, 'category')) {
        if (!requireField(typeof postData.category === 'string' && postData.category.trim(), 'Category is required')) {
            return false;
        }
    }

    if (!partial || Object.hasOwn(postData, 'title')) {
        if (!requireField(typeof postData.title === 'string' && postData.title.trim(), 'Title is required')) {
            return false;
        }
    }

    if (!partial || Object.hasOwn(postData, 'cover')) {
        if (!requireField(typeof postData.cover === 'string' && postData.cover.trim(), 'Cover is required')) {
            return false;
        }
    }

    if (!partial || Object.hasOwn(postData, 'content')) {
        if (!requireField(typeof postData.content === 'string' && postData.content.trim(), 'Content is required')) {
            return false;
        }
    }

    if (!partial || Object.hasOwn(postData, 'readTime')) {
        const isReadTimeValid = (
            postData.readTime
            && typeof postData.readTime === 'object'
            && Number.isInteger(postData.readTime.value)
            && postData.readTime.value >= 1
            && postData.readTime.unit === 'min'
        );

        if (!requireField(isReadTimeValid, 'readTime must include an integer value >= 1 and unit "min"')) {
            return false;
        }
    }

    return true;
};
