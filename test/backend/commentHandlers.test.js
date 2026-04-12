import { beforeEach, describe, expect, it, vi } from 'vitest';

const findByIdMock = vi.fn();
const findOneMock = vi.fn();
const findOneAndUpdateMock = vi.fn();
const findByIdAndUpdateMock = vi.fn();
const isOwnedByAuthenticatedAuthorMock = vi.fn();
const sendForbiddenOwnershipErrorMock = vi.fn();

vi.mock('../../backend/models/Post.js', () => ({
    default: {
        findById: findByIdMock,
        findOne: findOneMock,
        findOneAndUpdate: findOneAndUpdateMock,
        findByIdAndUpdate: findByIdAndUpdateMock
    }
}));

vi.mock('../../backend/utils/ownership.js', () => ({
    isOwnedByAuthenticatedAuthor: isOwnedByAuthenticatedAuthorMock,
    sendForbiddenOwnershipError: sendForbiddenOwnershipErrorMock
}));

const {
    createComment,
    deleteComment,
    getSingleComment,
    listComments,
    updateComment
} = await import('../../backend/routes/posts/commentHandlers.js');

const createResponse = () => ({
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis()
});

const buildCommentPost = () => {
    const comments = [
        {
            author: '507f1f77bcf86cd799439011',
            _id: '507f1f77bcf86cd799439031',
            comment: 'First comment'
        }
    ];

    comments.id = vi.fn((commentId) => comments.find((comment) => comment._id === commentId) ?? null);
    comments.push = (...items) => Array.prototype.push.apply(comments, items);

    return {
        comments,
        save: vi.fn().mockResolvedValue(undefined)
    };
};

describe('comment handlers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(true);
    });

    it('lists comments for a post', async () => {
        const post = buildCommentPost();
        findByIdMock.mockReturnValue({
            select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(post)
            })
        });
        const response = createResponse();

        await listComments({
            params: { postId: '507f1f77bcf86cd799439021' }
        }, response);

        expect(response.send).toHaveBeenCalledWith(post.comments);
    });

    it('gets a single comment', async () => {
        const post = buildCommentPost();
        findOneMock.mockResolvedValue(post);
        const response = createResponse();

        await getSingleComment({
            params: {
                commentId: '507f1f77bcf86cd799439031',
                postId: '507f1f77bcf86cd799439021'
            }
        }, response);

        expect(findOneMock).toHaveBeenCalledWith(
            { _id: '507f1f77bcf86cd799439021', 'comments._id': '507f1f77bcf86cd799439031' },
            { 'comments.$': 1 }
        );
        expect(response.send).toHaveBeenCalledWith(post.comments[0]);
    });

    it('creates a comment', async () => {
        const post = buildCommentPost();
        findByIdMock.mockResolvedValue(post);
        const response = createResponse();

        await createComment({
            author: { _id: '507f1f77bcf86cd799439011' },
            body: { comment: '  New comment  ' },
            params: { postId: '507f1f77bcf86cd799439021' }
        }, response);

        expect(post.save).toHaveBeenCalledOnce();
        expect(response.status).toHaveBeenCalledWith(201);
        expect(response.send).toHaveBeenCalledWith({
            author: '507f1f77bcf86cd799439011',
            comment: 'New comment'
        });
    });

    it('updates a comment', async () => {
        const postWithComment = buildCommentPost();
        findOneMock.mockResolvedValue(postWithComment);

        const updatedPost = buildCommentPost();
        updatedPost.comments[0].comment = 'Updated comment';
        findOneAndUpdateMock.mockResolvedValue(updatedPost);

        const response = createResponse();

        await updateComment({
            author: { _id: '507f1f77bcf86cd799439011' },
            body: { comment: ' Updated comment ' },
            params: {
                commentId: '507f1f77bcf86cd799439031',
                postId: '507f1f77bcf86cd799439021'
            }
        }, response);

        expect(findOneAndUpdateMock).toHaveBeenCalledWith(
            { _id: '507f1f77bcf86cd799439021', 'comments._id': '507f1f77bcf86cd799439031' },
            { $set: { 'comments.$.comment': 'Updated comment' } },
            { returnDocument: 'after', runValidators: true }
        );
        expect(response.send).toHaveBeenCalledWith(
            updatedPost.comments.id('507f1f77bcf86cd799439031')
        );
    });

    it('rejects updating a comment owned by another user', async () => {
        const post = buildCommentPost();
        findOneMock.mockResolvedValue(post);
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(false);
        const response = createResponse();

        await updateComment({
            author: { _id: '507f1f77bcf86cd799439012' },
            body: { comment: ' Updated comment ' },
            params: {
                commentId: '507f1f77bcf86cd799439031',
                postId: '507f1f77bcf86cd799439021'
            }
        }, response);

        expect(sendForbiddenOwnershipErrorMock).toHaveBeenCalledWith(
            response,
            'You can update only your own comments'
        );
    });

    it('deletes a comment', async () => {
        const post = buildCommentPost();
        findOneMock.mockResolvedValue(post);
        findByIdAndUpdateMock.mockResolvedValue(undefined);
        const response = createResponse();

        await deleteComment({
            author: { _id: '507f1f77bcf86cd799439011' },
            params: {
                commentId: '507f1f77bcf86cd799439031',
                postId: '507f1f77bcf86cd799439021'
            }
        }, response);

        expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
            '507f1f77bcf86cd799439021',
            { $pull: { comments: { _id: '507f1f77bcf86cd799439031' } } }
        );
        expect(response.send).toHaveBeenCalledWith({ message: 'Comment deleted' });
    });

    it('rejects deleting a comment owned by another user', async () => {
        const post = buildCommentPost();
        findOneMock.mockResolvedValue(post);
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(false);
        const response = createResponse();

        await deleteComment({
            author: { _id: '507f1f77bcf86cd799439012' },
            params: {
                commentId: '507f1f77bcf86cd799439031',
                postId: '507f1f77bcf86cd799439021'
            }
        }, response);

        expect(sendForbiddenOwnershipErrorMock).toHaveBeenCalledWith(
            response,
            'You can delete only your own comments'
        );
    });
});
