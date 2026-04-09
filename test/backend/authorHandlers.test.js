import { beforeEach, describe, expect, it, vi } from 'vitest';

const createMock = vi.fn();
const findByIdMock = vi.fn();
const findByIdAndDeleteMock = vi.fn();
const findByIdAndUpdateMock = vi.fn();
const findMock = vi.fn();
const hashPasswordMock = vi.fn();
const isOwnedByAuthenticatedAuthorMock = vi.fn();
const sendForbiddenOwnershipErrorMock = vi.fn();
const sendMailMock = vi.fn();

vi.mock('../../backend/models/Author.js', () => ({
    default: {
        create: createMock,
        find: findMock,
        findById: findByIdMock,
        findByIdAndDelete: findByIdAndDeleteMock,
        findByIdAndUpdate: findByIdAndUpdateMock
    }
}));

vi.mock('../../backend/middlewares/mailer.js', () => ({
    default: {
        sendMail: sendMailMock
    }
}));

vi.mock('../../backend/utils/passwords.js', () => ({
    hashPassword: hashPasswordMock
}));

vi.mock('../../backend/utils/ownership.js', () => ({
    isOwnedByAuthenticatedAuthor: isOwnedByAuthenticatedAuthorMock,
    sendForbiddenOwnershipError: sendForbiddenOwnershipErrorMock
}));

const {
    createAuthor,
    deleteAuthor,
    getAuthorById,
    listAuthors,
    updateAuthor,
    updateAuthorAvatar
} = await import('../../backend/routes/authors/handlers.js');

const createResponse = () => ({
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis()
});

describe('author handlers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sendMailMock.mockReturnValue({
            catch: vi.fn()
        });
    });

    it('lists authors', async () => {
        findMock.mockReturnValue({
            lean: vi.fn().mockResolvedValue([{ email: 'author@example.com' }])
        });
        const response = createResponse();

        await listAuthors({}, response);

        expect(response.send).toHaveBeenCalledWith([{ email: 'author@example.com' }]);
    });

    it('gets an author by id', async () => {
        findByIdMock.mockReturnValue({
            lean: vi.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' })
        });
        const response = createResponse();

        await getAuthorById({
            params: { authorId: '507f1f77bcf86cd799439011' }
        }, response);

        expect(response.send).toHaveBeenCalledWith({ _id: '507f1f77bcf86cd799439011' });
    });

    it('creates an author with a hashed password', async () => {
        hashPasswordMock.mockResolvedValue('hashed-password');
        createMock.mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com',
            firstName: 'Mario'
        });
        const response = createResponse();

        await createAuthor({
            body: {
                email: 'Author@Example.com',
                firstName: 'Mario',
                password: 'secret123'
            }
        }, response);

        expect(hashPasswordMock).toHaveBeenCalledWith('secret123');
        expect(createMock).toHaveBeenCalledWith({
            email: 'author@example.com',
            firstName: 'Mario',
            password: 'hashed-password'
        });
        expect(response.status).toHaveBeenCalledWith(201);
    });

    it('rejects author updates from another user', async () => {
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(false);
        const response = createResponse();

        await updateAuthor({
            author: { _id: '507f1f77bcf86cd799439012' },
            body: { firstName: 'Luigi' },
            params: { authorId: '507f1f77bcf86cd799439011' }
        }, response);

        expect(sendForbiddenOwnershipErrorMock).toHaveBeenCalledWith(
            response,
            'You can update only your own author profile'
        );
    });

    it('updates an owned author and hashes a new password when provided', async () => {
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(true);
        hashPasswordMock.mockResolvedValue('new-hash');
        findByIdAndUpdateMock.mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            firstName: 'Mario'
        });
        const response = createResponse();

        await updateAuthor({
            author: { _id: '507f1f77bcf86cd799439011' },
            body: { firstName: 'Mario', password: 'secret123' },
            params: { authorId: '507f1f77bcf86cd799439011' }
        }, response);

        expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
            '507f1f77bcf86cd799439011',
            { firstName: 'Mario', password: 'new-hash' },
            { new: true, runValidators: true }
        );
        expect(response.send).toHaveBeenCalled();
    });

    it('updates an owned author avatar', async () => {
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(true);
        findByIdAndUpdateMock.mockResolvedValue({ avatar: 'https://cdn.example/avatar.jpg' });
        const response = createResponse();

        await updateAuthorAvatar({
            author: { _id: '507f1f77bcf86cd799439011' },
            file: { path: 'https://cdn.example/avatar.jpg' },
            params: { authorId: '507f1f77bcf86cd799439011' }
        }, response);

        expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
            '507f1f77bcf86cd799439011',
            { avatar: 'https://cdn.example/avatar.jpg' },
            { new: true }
        );
    });

    it('deletes an owned author', async () => {
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(true);
        findByIdAndDeleteMock.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
        const response = createResponse();

        await deleteAuthor({
            author: { _id: '507f1f77bcf86cd799439011' },
            params: { authorId: '507f1f77bcf86cd799439011' }
        }, response);

        expect(findByIdAndDeleteMock).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        expect(response.send).toHaveBeenCalledWith({ message: 'author deleted' });
    });
});
