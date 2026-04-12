import { normalizeAuthorId } from './authenticatedAuthor.js';

export const isOwnedByAuthenticatedAuthor = (request, ownerId) => {
    const authenticatedAuthorId = normalizeAuthorId(request.author?._id);
    const resourceOwnerId = normalizeAuthorId(ownerId);

    return Boolean(authenticatedAuthorId && resourceOwnerId && authenticatedAuthorId === resourceOwnerId);
};

export const sendForbiddenOwnershipError = (response, message = 'You are not allowed to modify this resource') => {
    response.status(403).send({ message });
};
