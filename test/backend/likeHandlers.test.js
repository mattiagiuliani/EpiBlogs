import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Model mocks ───────────────────────────────────────────────────────────────

const postExistsMock = vi.fn();
const likeCountDocumentsMock = vi.fn();
const likeExistsMock = vi.fn();
const likeFindOneMock = vi.fn();
const likeCreateMock = vi.fn();
const likeDeleteOneMock = vi.fn();

vi.mock('../../backend/models/Post.js', () => ({
    default: {
        exists: postExistsMock
    }
}));

vi.mock('../../backend/models/PostLike.js', () => ({
    default: {
        countDocuments: likeCountDocumentsMock,
        exists: likeExistsMock,
        findOne: likeFindOneMock,
        create: likeCreateMock,
        deleteOne: likeDeleteOneMock
    }
}));

const { getLikes, toggleLike } = await import('../../backend/routes/posts/likeHandlers.js');

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_POST_ID   = '507f1f77bcf86cd799439011';
const VALID_AUTHOR_ID = '507f1f77bcf86cd799439022';

const createResponse = () => ({
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis()
});

const createRequest = (overrides = {}) => ({
    params: { postId: VALID_POST_ID },
    author: null,
    ...overrides
});

// ── getLikes ──────────────────────────────────────────────────────────────────

describe('getLikes', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns 400 when postId is not a valid ObjectId', async () => {
        const req = createRequest({ params: { postId: 'not-an-id' } });
        const res = createResponse();

        await getLikes(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: 'Invalid postId' });
    });

    it('returns 404 when the post does not exist', async () => {
        postExistsMock.mockResolvedValue(null);
        const req = createRequest();
        const res = createResponse();

        await getLikes(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({ message: 'Post not found' });
    });

    it('returns count and likedByMe:false for unauthenticated request', async () => {
        postExistsMock.mockResolvedValue({ _id: VALID_POST_ID });
        likeCountDocumentsMock.mockResolvedValue(5);
        // likeExistsMock should NOT be called — no author

        const req = createRequest({ author: null });
        const res = createResponse();

        await getLikes(req, res);

        expect(likeExistsMock).not.toHaveBeenCalled();
        expect(res.send).toHaveBeenCalledWith({ count: 5, likedByMe: false });
    });

    it('returns count and likedByMe:true when authenticated author has liked', async () => {
        postExistsMock.mockResolvedValue({ _id: VALID_POST_ID });
        likeCountDocumentsMock.mockResolvedValue(3);
        likeExistsMock.mockResolvedValue({ _id: 'like-1' });

        const req = createRequest({ author: { _id: VALID_AUTHOR_ID } });
        const res = createResponse();

        await getLikes(req, res);

        expect(likeExistsMock).toHaveBeenCalledWith({ post: VALID_POST_ID, author: VALID_AUTHOR_ID });
        expect(res.send).toHaveBeenCalledWith({ count: 3, likedByMe: true });
    });

    it('returns count and likedByMe:false when authenticated author has NOT liked', async () => {
        postExistsMock.mockResolvedValue({ _id: VALID_POST_ID });
        likeCountDocumentsMock.mockResolvedValue(2);
        likeExistsMock.mockResolvedValue(null);

        const req = createRequest({ author: { _id: VALID_AUTHOR_ID } });
        const res = createResponse();

        await getLikes(req, res);

        expect(res.send).toHaveBeenCalledWith({ count: 2, likedByMe: false });
    });

    it('returns 500 on unexpected error', async () => {
        postExistsMock.mockRejectedValue(new Error('DB error'));
        const req = createRequest();
        const res = createResponse();

        await getLikes(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ message: 'DB error' });
    });
});

// ── toggleLike ────────────────────────────────────────────────────────────────

describe('toggleLike', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns 400 when postId is not a valid ObjectId', async () => {
        const req = createRequest({ params: { postId: 'bad-id' }, author: { _id: VALID_AUTHOR_ID } });
        const res = createResponse();

        await toggleLike(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: 'Invalid postId' });
    });

    it('returns 404 when the post does not exist', async () => {
        postExistsMock.mockResolvedValue(null);
        const req = createRequest({ author: { _id: VALID_AUTHOR_ID } });
        const res = createResponse();

        await toggleLike(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({ message: 'Post not found' });
    });

    it('creates a like when the author has not yet liked the post', async () => {
        postExistsMock.mockResolvedValue({ _id: VALID_POST_ID });
        likeFindOneMock.mockResolvedValue(null);         // no existing like
        likeCreateMock.mockResolvedValue({});
        likeCountDocumentsMock.mockResolvedValue(1);

        const req = createRequest({ author: { _id: VALID_AUTHOR_ID } });
        const res = createResponse();

        await toggleLike(req, res);

        expect(likeCreateMock).toHaveBeenCalledWith({ post: VALID_POST_ID, author: VALID_AUTHOR_ID });
        expect(likeDeleteOneMock).not.toHaveBeenCalled();
        expect(res.send).toHaveBeenCalledWith({ count: 1, likedByMe: true });
    });

    it('removes an existing like when the author already liked the post', async () => {
        postExistsMock.mockResolvedValue({ _id: VALID_POST_ID });
        const existingLike = { _id: 'like-99' };
        likeFindOneMock.mockResolvedValue(existingLike);
        likeDeleteOneMock.mockResolvedValue({});
        likeCountDocumentsMock.mockResolvedValue(0);

        const req = createRequest({ author: { _id: VALID_AUTHOR_ID } });
        const res = createResponse();

        await toggleLike(req, res);

        expect(likeDeleteOneMock).toHaveBeenCalledWith({ _id: 'like-99' });
        expect(likeCreateMock).not.toHaveBeenCalled();
        expect(res.send).toHaveBeenCalledWith({ count: 0, likedByMe: false });
    });

    it('returns 500 on unexpected error', async () => {
        postExistsMock.mockRejectedValue(new Error('DB timeout'));
        const req = createRequest({ author: { _id: VALID_AUTHOR_ID } });
        const res = createResponse();

        await toggleLike(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ message: 'DB timeout' });
    });
});
