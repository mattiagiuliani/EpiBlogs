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
