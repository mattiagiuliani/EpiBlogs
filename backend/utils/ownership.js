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

export const isOwnedByAuthenticatedAuthor = (request, ownerId) => {
    const authenticatedAuthorId = normalizeId(request.author?._id);
    const resourceOwnerId = normalizeId(ownerId);

    return Boolean(authenticatedAuthorId && resourceOwnerId && authenticatedAuthorId === resourceOwnerId);
};

export const sendForbiddenOwnershipError = (response, message = 'You are not allowed to modify this resource') => {
    response.status(403).send({ message });
};
