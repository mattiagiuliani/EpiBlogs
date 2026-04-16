import { beforeEach, describe, expect, it, vi } from 'vitest';

const authorFindByIdMock = vi.fn();
const categoryFindOneMock = vi.fn();
const postCountDocumentsMock = vi.fn();
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

vi.mock('../../backend/models/Category.js', () => ({
    default: {
        findOne: categoryFindOneMock
    }
}));

vi.mock('../../backend/models/Post.js', () => ({
    default: {
        countDocuments: postCountDocumentsMock,
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
    searchPosts,
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
        // Default: Category lookup returns null so existing tests remain unaffected.
        categoryFindOneMock.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
        sendMailMock.mockReturnValue({
            catch: vi.fn()
        });
    });

    it('lists all posts when no query params are provided', async () => {
        postFindMock.mockReturnValue({
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue([{ title: 'Post A' }, { title: 'Post B' }])
        });
        postCountDocumentsMock.mockResolvedValue(2);
        const response = createResponse();

        await listPosts({ query: {} }, response);

        expect(postFindMock).toHaveBeenCalledWith({});
        expect(response.send).toHaveBeenCalledWith({
            data: [{ title: 'Post A' }, { title: 'Post B' }],
            total: 2,
            page: 1,
            limit: 20,
            totalPages: 1
        });
    });

    it('lists posts filtered by search query', async () => {
        postFindMock.mockReturnValue({
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue([{ title: 'Matching post' }])
        });
        postCountDocumentsMock.mockResolvedValue(1);
        const response = createResponse();

        await listPosts({ query: { search: 'match' } }, response);

        expect(postFindMock).toHaveBeenCalledWith({
            title: { $regex: 'match', $options: 'i' }
        });
        expect(response.send).toHaveBeenCalledWith({
            data: [{ title: 'Matching post' }],
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1
        });
    });

    it('filters posts by categorySlug when ?category= is provided', async () => {
        postFindMock.mockReturnValue({
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue([{ title: 'AI post', categorySlug: 'artificial-intelligence' }])
        });
        postCountDocumentsMock.mockResolvedValue(1);
        const response = createResponse();

        await listPosts({ query: { category: 'artificial-intelligence' } }, response);

        // Must filter by slug, never by the human-readable name
        expect(postFindMock).toHaveBeenCalledWith({ categorySlug: 'artificial-intelligence' });
        expect(postFindMock).not.toHaveBeenCalledWith(
            expect.objectContaining({ category: expect.any(String) })
        );
    });

    it('does not filter by category name (regression guard)', async () => {
        postFindMock.mockReturnValue({
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue([])
        });
        postCountDocumentsMock.mockResolvedValue(0);
        const response = createResponse();

        await listPosts({ query: { category: 'Artificial Intelligence' } }, response);

        // A name string in ?category= is forwarded as categorySlug; the filter
        // key must never be 'category'.
        const [filterArg] = postFindMock.mock.calls[0];
        expect(Object.keys(filterArg)).not.toContain('category');
        expect(Object.keys(filterArg)).toContain('categorySlug');
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
                category: 'Tech',
                title: 'Nope',
                cover: 'https://example.com/cover.jpg',
                readTime: { value: 5, unit: 'min' },
                content: 'Body'
            }
        }, response);

        expect(sendForbiddenOwnershipErrorMock).toHaveBeenCalledWith(
            response,
            'You can create posts only for your own author profile'
        );
    });

    it('rejects malformed post payloads before writing', async () => {
        const response = createResponse();

        await createPost({
            author: { _id: '507f1f77bcf86cd799439011' },
            body: {
                author: '507f1f77bcf86cd799439011',
                category: 'Tech',
                readTime: { value: 0, unit: 'hours' },
                title: 'Invalid'
            }
        }, response);

        expect(response.status).toHaveBeenCalledWith(400);
        expect(postCreateMock).not.toHaveBeenCalled();
    });

    it('rejects updating a post owned by another author', async () => {
        postFindByIdMock.mockReturnValue({
            select: vi.fn().mockResolvedValue({ author: '507f1f77bcf86cd799439011' })
        });
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(false);
        const response = createResponse();

        await updatePost({
            author: { _id: '507f1f77bcf86cd799439012' },
            body: { title: 'Hijacked' },
            params: { postId: '507f1f77bcf86cd799439021' }
        }, response);

        expect(sendForbiddenOwnershipErrorMock).toHaveBeenCalledWith(
            response,
            'You can update only your own posts'
        );
        expect(postFindByIdAndUpdateMock).not.toHaveBeenCalled();
    });

    it('cannot reassign post author via update', async () => {
        postFindByIdMock.mockReturnValue({
            select: vi.fn().mockResolvedValue({ author: '507f1f77bcf86cd799439011' })
        });
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(true);
        postFindByIdAndUpdateMock.mockResolvedValue({ title: 'Updated' });
        const response = createResponse();

        await updatePost({
            author: { _id: '507f1f77bcf86cd799439011' },
            body: {
                title: 'Updated',
                author: '507f1f77bcf86cd799439999'  // attempt to reassign
            },
            params: { postId: '507f1f77bcf86cd799439021' }
        }, response);

        // author must be stripped from the update payload
        expect(postFindByIdAndUpdateMock).toHaveBeenCalledWith(
            '507f1f77bcf86cd799439021',
            { title: 'Updated' },
            { returnDocument: 'after', runValidators: true }
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
            { returnDocument: 'after', runValidators: true }
        );
    });

    it('rejects malformed post updates', async () => {
        postFindByIdMock.mockReturnValue({
            select: vi.fn().mockResolvedValue({ author: '507f1f77bcf86cd799439011' })
        });
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(true);
        const response = createResponse();

        await updatePost({
            author: { _id: '507f1f77bcf86cd799439011' },
            body: { readTime: { value: 0, unit: 'hours' } },
            params: { postId: '507f1f77bcf86cd799439021' }
        }, response);

        expect(response.status).toHaveBeenCalledWith(400);
        expect(postFindByIdAndUpdateMock).not.toHaveBeenCalled();
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
            { returnDocument: 'after', runValidators: true }
        );
    });

    it('rejects deleting a post owned by another author', async () => {
        postFindByIdMock.mockReturnValue({
            select: vi.fn().mockResolvedValue({ author: '507f1f77bcf86cd799439011' })
        });
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(false);
        const response = createResponse();

        await deletePost({
            author: { _id: '507f1f77bcf86cd799439012' },
            params: { postId: '507f1f77bcf86cd799439021' }
        }, response);

        expect(sendForbiddenOwnershipErrorMock).toHaveBeenCalledWith(
            response,
            'You can delete only your own posts'
        );
        expect(postFindByIdAndDeleteMock).not.toHaveBeenCalled();
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

    it('derives categorySlug from Category collection on post creation', async () => {
        categoryFindOneMock.mockReturnValue({
            lean: vi.fn().mockResolvedValue({
                name: 'Artificial Intelligence',
                slug: 'artificial-intelligence'
            })
        });
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(true);
        authorFindByIdMock.mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com',
            firstName: 'Mario'
        });
        postCreateMock.mockResolvedValue({ _id: 'post-id', title: 'AI Post' });
        const response = createResponse();

        await createPost({
            author: { _id: '507f1f77bcf86cd799439011' },
            body: {
                author: '507f1f77bcf86cd799439011',
                category: 'Artificial Intelligence',
                content: 'Body',
                cover: 'https://example.com/cover.jpg',
                readTime: { unit: 'min', value: 5 },
                title: 'AI Post'
            }
        }, response);

        expect(postCreateMock).toHaveBeenCalledWith(expect.objectContaining({
            category: 'Artificial Intelligence',
            categorySlug: 'artificial-intelligence'
        }));
    });

    it('derives categorySlug when frontend sends a slug as category on creation', async () => {
        categoryFindOneMock.mockReturnValue({
            lean: vi.fn().mockResolvedValue({
                name: 'Artificial Intelligence',
                slug: 'artificial-intelligence'
            })
        });
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(true);
        authorFindByIdMock.mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com',
            firstName: 'Mario'
        });
        postCreateMock.mockResolvedValue({ _id: 'post-id', title: 'AI Post' });
        const response = createResponse();

        await createPost({
            author: { _id: '507f1f77bcf86cd799439011' },
            body: {
                author: '507f1f77bcf86cd799439011',
                category: 'artificial-intelligence',  // slug sent by frontend
                content: 'Body',
                cover: 'https://example.com/cover.jpg',
                readTime: { unit: 'min', value: 5 },
                title: 'AI Post'
            }
        }, response);

        // Backend normalizes: stores readable name + slug
        expect(postCreateMock).toHaveBeenCalledWith(expect.objectContaining({
            category: 'Artificial Intelligence',
            categorySlug: 'artificial-intelligence'
        }));
    });

    it('normalizes category name and slug on post update', async () => {
        postFindByIdMock.mockReturnValue({
            select: vi.fn().mockResolvedValue({ author: '507f1f77bcf86cd799439011' })
        });
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(true);
        categoryFindOneMock.mockReturnValue({
            lean: vi.fn().mockResolvedValue({
                name: 'Web Development',
                slug: 'web-development'
            })
        });
        postFindByIdAndUpdateMock.mockResolvedValue({ title: 'Updated' });
        const response = createResponse();

        await updatePost({
            author: { _id: '507f1f77bcf86cd799439011' },
            body: { category: 'web-development' },  // slug sent by frontend
            params: { postId: '507f1f77bcf86cd799439021' }
        }, response);

        expect(postFindByIdAndUpdateMock).toHaveBeenCalledWith(
            '507f1f77bcf86cd799439021',
            expect.objectContaining({
                category: 'Web Development',
                categorySlug: 'web-development'
            }),
            { returnDocument: 'after', runValidators: true }
        );
    });

    // ── POST /search (text-index based) ──────────────────────────────────────

    it('searchPosts returns all posts when body is empty', async () => {
        postFindMock.mockReturnValue({
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue([{ title: 'Post A' }])
        });
        postCountDocumentsMock.mockResolvedValue(1);
        const response = createResponse();

        await searchPosts({ body: {}, query: {} }, response);

        expect(postFindMock).toHaveBeenCalledWith({});
        expect(response.send).toHaveBeenCalledWith(
            expect.objectContaining({ data: [{ title: 'Post A' }], total: 1 })
        );
    });

    it('searchPosts builds $text filter from body.search', async () => {
        postFindMock.mockReturnValue({
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue([])
        });
        postCountDocumentsMock.mockResolvedValue(0);
        const response = createResponse();

        await searchPosts({ body: { search: 'machine learning' }, query: {} }, response);

        expect(postFindMock).toHaveBeenCalledWith({ $text: { $search: 'machine learning' } });
        // Must NOT fall back to regex
        const [filterArg] = postFindMock.mock.calls[0];
        expect(filterArg).not.toHaveProperty('title');
    });

    it('searchPosts filters by categorySlug from body', async () => {
        postFindMock.mockReturnValue({
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue([])
        });
        postCountDocumentsMock.mockResolvedValue(0);
        const response = createResponse();

        await searchPosts({ body: { categorySlug: 'web-development' }, query: {} }, response);

        expect(postFindMock).toHaveBeenCalledWith({ categorySlug: 'web-development' });
    });

    it('searchPosts filters by tags array from body ($in logic)', async () => {
        postFindMock.mockReturnValue({
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue([])
        });
        postCountDocumentsMock.mockResolvedValue(0);
        const response = createResponse();

        await searchPosts({ body: { tags: ['ai', 'ml'] }, query: {} }, response);

        expect(postFindMock).toHaveBeenCalledWith({ tags: { $in: ['ai', 'ml'] } });
    });

    it('searchPosts combines all three filters correctly', async () => {
        postFindMock.mockReturnValue({
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue([])
        });
        postCountDocumentsMock.mockResolvedValue(0);
        const response = createResponse();

        await searchPosts({
            body: { search: 'neural networks', categorySlug: 'artificial-intelligence', tags: ['ai', 'deep-learning'] },
            query: {}
        }, response);

        expect(postFindMock).toHaveBeenCalledWith({
            $text: { $search: 'neural networks' },
            categorySlug: 'artificial-intelligence',
            tags: { $in: ['ai', 'deep-learning'] }
        });
    });

    it('searchPosts ignores empty tags array', async () => {
        postFindMock.mockReturnValue({
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue([])
        });
        postCountDocumentsMock.mockResolvedValue(0);
        const response = createResponse();

        await searchPosts({ body: { tags: [] }, query: {} }, response);

        const [filterArg] = postFindMock.mock.calls[0];
        expect(filterArg).not.toHaveProperty('tags');
    });

    it('searchPosts returns paginated envelope', async () => {
        postFindMock.mockReturnValue({
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue([{ title: 'P1' }, { title: 'P2' }])
        });
        postCountDocumentsMock.mockResolvedValue(42);
        const response = createResponse();

        await searchPosts({ body: {}, query: { page: '3', limit: '2' } }, response);

        expect(response.send).toHaveBeenCalledWith({
            data: [{ title: 'P1' }, { title: 'P2' }],
            total: 42,
            page: 3,
            limit: 2,
            totalPages: 21
        });
    });

    // ── Tag system ────────────────────────────────────────────────────────────

    it('stores normalized tags on post creation', async () => {
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(true);
        authorFindByIdMock.mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com',
            firstName: 'Mario'
        });
        postCreateMock.mockResolvedValue({ _id: 'post-id', title: 'Tagged Post' });
        const response = createResponse();

        await createPost({
            author: { _id: '507f1f77bcf86cd799439011' },
            body: {
                author: '507f1f77bcf86cd799439011',
                category: 'Tech',
                content: 'Body',
                cover: 'https://example.com/cover.jpg',
                readTime: { unit: 'min', value: 5 },
                title: 'Tagged Post',
                tags: ['Machine Learning', 'web dev', 'machine-learning']  // duplicate after normalization
            }
        }, response);

        expect(postCreateMock).toHaveBeenCalledWith(expect.objectContaining({
            tags: ['machine-learning', 'web-dev']  // deduplicated, normalized
        }));
    });

    it('stores empty tags array when no tags provided', async () => {
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(true);
        authorFindByIdMock.mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com',
            firstName: 'Mario'
        });
        postCreateMock.mockResolvedValue({ _id: 'post-id', title: 'No Tags Post' });
        const response = createResponse();

        await createPost({
            author: { _id: '507f1f77bcf86cd799439011' },
            body: {
                author: '507f1f77bcf86cd799439011',
                category: 'Tech',
                content: 'Body',
                cover: 'https://example.com/cover.jpg',
                readTime: { unit: 'min', value: 5 },
                title: 'No Tags Post'
            }
        }, response);

        expect(postCreateMock).toHaveBeenCalledWith(expect.objectContaining({
            tags: []
        }));
    });

    it('filters posts by a single tag', async () => {
        postFindMock.mockReturnValue({
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue([{ title: 'AI Post', tags: ['ai'] }])
        });
        postCountDocumentsMock.mockResolvedValue(1);
        const response = createResponse();

        await listPosts({ query: { tag: 'ai' } }, response);

        expect(postFindMock).toHaveBeenCalledWith({ tags: { $in: ['ai'] } });
    });

    it('filters posts by multiple tags with OR logic', async () => {
        postFindMock.mockReturnValue({
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue([])
        });
        postCountDocumentsMock.mockResolvedValue(0);
        const response = createResponse();

        await listPosts({ query: { tag: 'ai,web-dev' } }, response);

        expect(postFindMock).toHaveBeenCalledWith({ tags: { $in: ['ai', 'web-dev'] } });
    });

    it('combines categorySlug and tag filters', async () => {
        postFindMock.mockReturnValue({
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue([])
        });
        postCountDocumentsMock.mockResolvedValue(0);
        const response = createResponse();

        await listPosts({ query: { category: 'web-development', tag: 'ai,react' } }, response);

        expect(postFindMock).toHaveBeenCalledWith({
            categorySlug: 'web-development',
            tags: { $in: ['ai', 'react'] }
        });
    });

    it('normalizes tags on post update', async () => {
        postFindByIdMock.mockReturnValue({
            select: vi.fn().mockResolvedValue({ author: '507f1f77bcf86cd799439011' })
        });
        isOwnedByAuthenticatedAuthorMock.mockReturnValue(true);
        postFindByIdAndUpdateMock.mockResolvedValue({ title: 'Updated' });
        const response = createResponse();

        await updatePost({
            author: { _id: '507f1f77bcf86cd799439011' },
            body: { tags: ['Node JS', 'express ', 'node-js'] },
            params: { postId: '507f1f77bcf86cd799439021' }
        }, response);

        expect(postFindByIdAndUpdateMock).toHaveBeenCalledWith(
            '507f1f77bcf86cd799439021',
            expect.objectContaining({ tags: ['node-js', 'express'] }),
            { returnDocument: 'after', runValidators: true }
        );
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
