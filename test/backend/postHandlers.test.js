import { beforeEach, describe, expect, it, vi } from 'vitest';

const authorFindByIdMock = vi.fn();
const postCreateMock = vi.fn();
const postFindByIdMock = vi.fn();
const postFindByIdAndDeleteMock = vi.fn();
const postFindByIdAndUpdateMock = vi.fn();
const postFindMock = vi.fn();
const isOwnedByAuthenticatedAuthorMock = vi.fn();
const sendForbiddenOwnershipErrorMock = vi.fn();
const sendMailMock = vi.fn();

vi.mock('../../backend/models/Author.js', () => ({
    default: {
        findById: authorFindByIdMock
    }
}));

vi.mock('../../backend/models/Post.js', () => ({
    default: {
        create: postCreateMock,
        find: postFindMock,
        findById: postFindByIdMock,
        findByIdAndDelete: postFindByIdAndDeleteMock,
        findByIdAndUpdate: postFindByIdAndUpdateMock
    }
}));

vi.mock('../../backend/middlewares/mailer.js', () => ({
    default: {
        sendMail: sendMailMock
    }
}));

vi.mock('../../backend/utils/ownership.js', () => ({
    isOwnedByAuthenticatedAuthor: isOwnedByAuthenticatedAuthorMock,
    sendForbiddenOwnershipError: sendForbiddenOwnershipErrorMock
}));

const {
    createPost,
    deletePost,
    getPostById,
    listPosts,
    listPostsByAuthor,
    updatePost,
    updatePostCover
} = await import('../../backend/routes/posts/postHandlers.js');

const createResponse = () => ({
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis()
});

describe('post handlers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sendMailMock.mockReturnValue({
            catch: vi.fn()
        });
    });

    it('lists posts filtered by search query', async () => {
        postFindMock.mockReturnValue({
            lean: vi.fn().mockResolvedValue([{ title: 'Matching post' }])
        });
        const response = createResponse();

        await listPosts({ query: { search: 'match' } }, response);

        expect(postFindMock).toHaveBeenCalledWith({
            title: { $regex: 'match', $options: 'i' }
        });
        expect(response.send).toHaveBeenCalledWith([{ title: 'Matching post' }]);
    });

    it('gets a post by id', async () => {
        postFindByIdMock.mockReturnValue({
            lean: vi.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' })
        });
        const response = createResponse();

        await getPostById({ params: { postId: '507f1f77bcf86cd799439011' } }, response);

        expect(response.send).toHaveBeenCalledWith({ _id: '507f1f77bcf86cd799439011' });
    });

    it('creates a post only for the authenticated author', async () => {
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(true);
        authorFindByIdMock.mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com',
            firstName: 'Mario'
        });
        postCreateMock.mockResolvedValue({ _id: 'post-id', title: 'New Post' });
        const response = createResponse();

        await createPost({
            author: { _id: '507f1f77bcf86cd799439011' },
            body: {
                author: '507f1f77bcf86cd799439011',
                category: 'Tech',
                content: 'Body',
                cover: 'https://example.com/cover.jpg',
                readTime: { unit: 'min', value: 5 },
                title: 'New Post'
            }
        }, response);

        expect(postCreateMock).toHaveBeenCalledWith(expect.objectContaining({
            author: '507f1f77bcf86cd799439011',
            authorEmail: 'author@example.com',
            title: 'New Post'
        }));
        expect(response.status).toHaveBeenCalledWith(201);
    });

    it('rejects creating a post for another author', async () => {
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(false);
        const response = createResponse();

        await createPost({
            author: { _id: '507f1f77bcf86cd799439012' },
            body: {
                author: '507f1f77bcf86cd799439011',
                title: 'Nope'
            }
        }, response);

        expect(sendForbiddenOwnershipErrorMock).toHaveBeenCalledWith(
            response,
            'You can create posts only for your own author profile'
        );
    });

    it('updates an owned post', async () => {
        postFindByIdMock.mockReturnValue({
            select: vi.fn().mockResolvedValue({ author: '507f1f77bcf86cd799439011' })
        });
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(true);
        postFindByIdAndUpdateMock.mockResolvedValue({ title: 'Updated' });
        const response = createResponse();

        await updatePost({
            author: { _id: '507f1f77bcf86cd799439011' },
            body: { title: 'Updated' },
            params: { postId: '507f1f77bcf86cd799439021' }
        }, response);

        expect(postFindByIdAndUpdateMock).toHaveBeenCalledWith(
            '507f1f77bcf86cd799439021',
            { title: 'Updated' },
            { new: true, runValidators: true }
        );
    });

    it('updates the cover of an owned post', async () => {
        postFindByIdMock.mockReturnValue({
            select: vi.fn().mockResolvedValue({ author: '507f1f77bcf86cd799439011' })
        });
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(true);
        postFindByIdAndUpdateMock.mockResolvedValue({ cover: 'https://cdn.example/cover.jpg' });
        const response = createResponse();

        await updatePostCover({
            author: { _id: '507f1f77bcf86cd799439011' },
            file: { path: 'https://cdn.example/cover.jpg' },
            params: { postId: '507f1f77bcf86cd799439021' }
        }, response);

        expect(postFindByIdAndUpdateMock).toHaveBeenCalledWith(
            '507f1f77bcf86cd799439021',
            { cover: 'https://cdn.example/cover.jpg' },
            { new: true }
        );
    });

    it('deletes an owned post', async () => {
        postFindByIdMock.mockReturnValue({
            select: vi.fn().mockResolvedValue({ author: '507f1f77bcf86cd799439011' })
        });
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(true);
        postFindByIdAndDeleteMock.mockResolvedValue({ _id: '507f1f77bcf86cd799439021' });
        const response = createResponse();

        await deletePost({
            author: { _id: '507f1f77bcf86cd799439011' },
            params: { postId: '507f1f77bcf86cd799439021' }
        }, response);

        expect(response.send).toHaveBeenCalledWith({ message: 'post deleted' });
    });

    it('lists posts by author', async () => {
        authorFindByIdMock.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
        postFindMock.mockReturnValue({
            lean: vi.fn().mockResolvedValue([{ title: 'Author Post' }])
        });
        const response = createResponse();

        await listPostsByAuthor({
            params: { authorId: '507f1f77bcf86cd799439011' }
        }, response);

        expect(postFindMock).toHaveBeenCalledWith({ author: '507f1f77bcf86cd799439011' });
        expect(response.send).toHaveBeenCalledWith([{ title: 'Author Post' }]);
    });
});
