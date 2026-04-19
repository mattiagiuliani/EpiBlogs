// @vitest-environment jsdom
import * as React from '../../frontend/node_modules/react/index.js';
import { act } from '../../frontend/node_modules/react/index.js';
import { createRoot } from '../../frontend/node_modules/react-dom/client.js';
import { MemoryRouter, Route, Routes } from '../../frontend/node_modules/react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// api.js — used by usePostComments and usePostLikes hooks
const apiMocks = vi.hoisted(() => ({
    listComments: vi.fn(),
    createComment: vi.fn(),
    getLikes: vi.fn(),
    toggleLike: vi.fn(),
}));
vi.mock('../../frontend/src/assets/api.js', () => apiMocks);

// client.js — used directly by PostDetail for the post fetch
const clientMock = vi.hoisted(() => ({
    default: { get: vi.fn() },
}));
vi.mock('../../frontend/src/api/client.js', () => clientMock);

const { default: PostDetail } = await import('../../frontend/src/PostDetail.jsx');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// ── Helpers ───────────────────────────────────────────────────────────────────

const STUB_POST = {
    _id: 'post-1',
    title: 'Test Post Title',
    content: 'Test post content body.',
    cover: 'https://example.com/cover.jpg',
    category: 'Tech',
    tags: ['react', 'vitest'],
    readTime: { value: 3, unit: 'min' },
    authorEmail: 'author@example.com',
};

const STUB_COMMENTS = [
    {
        _id: 'c1',
        comment: 'Great article!',
        author: { _id: 'a1', email: 'reader@example.com' },
        createdAt: '2026-04-19T10:00:00.000Z',
    },
];

const CURRENT_USER = { _id: 'a2', email: 'me@example.com' };

/**
 * Renders PostDetail at /post/:postId using MemoryRouter so that
 * useParams and useNavigate work without a real browser.
 */
const renderDetail = async (postId = 'post-1', currentUser = null) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(
            React.createElement(
                MemoryRouter,
                { initialEntries: [`/post/${postId}`] },
                React.createElement(
                    Routes,
                    null,
                    React.createElement(
                        Route,
                        { path: '/post/:postId', element: React.createElement(PostDetail, { currentUser }) }
                    )
                )
            )
        );
    });

    return {
        container,
        cleanup: async () => {
            await act(async () => { root.unmount(); });
            container.remove();
        },
    };
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PostDetail', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        // default stubs so tests that don't care about likes don't need to set them
        apiMocks.getLikes.mockResolvedValue({ count: 0, likedByMe: false });
        apiMocks.toggleLike.mockResolvedValue({ count: 1, likedByMe: true });
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('shows a loading spinner while the post is being fetched', async () => {
        // Never resolves during the test → stays in loading state
        clientMock.default.get.mockReturnValue(new Promise(() => {}));
        apiMocks.listComments.mockReturnValue(new Promise(() => {}));

        const view = await renderDetail();

        const spinner = view.container.querySelector('[aria-label="Loading"]');
        expect(spinner).not.toBeNull();

        await view.cleanup();
    });

    it('shows an error message when the post fetch fails', async () => {
        clientMock.default.get.mockRejectedValue(new Error('Post not found'));
        apiMocks.listComments.mockResolvedValue([]);

        const view = await renderDetail();

        await act(async () => { await Promise.resolve(); });

        expect(view.container.textContent).toContain('Post not found');

        await view.cleanup();
    });

    it('renders post title, content and tags after a successful fetch', async () => {
        clientMock.default.get.mockResolvedValue(STUB_POST);
        apiMocks.listComments.mockResolvedValue([]);

        const view = await renderDetail();

        await act(async () => { await Promise.resolve(); });

        expect(view.container.textContent).toContain('Test Post Title');
        expect(view.container.textContent).toContain('Test post content body.');
        expect(view.container.textContent).toContain('#react');
        expect(view.container.textContent).toContain('#vitest');

        await view.cleanup();
    });

    it('renders the comments list once comments are loaded', async () => {
        clientMock.default.get.mockResolvedValue(STUB_POST);
        apiMocks.listComments.mockResolvedValue(STUB_COMMENTS);

        const view = await renderDetail();

        await act(async () => { await Promise.resolve(); });

        expect(view.container.textContent).toContain('Great article!');
        expect(view.container.textContent).toContain('reader@example.com');

        await view.cleanup();
    });

    it('submits the add-comment form and calls createComment with the typed text', async () => {
        clientMock.default.get.mockResolvedValue(STUB_POST);
        apiMocks.listComments.mockResolvedValue([]);
        const savedComment = { _id: 'c-new', comment: 'My new comment', author: { _id: CURRENT_USER._id, email: CURRENT_USER.email }, createdAt: new Date().toISOString() };
        apiMocks.createComment.mockResolvedValue(savedComment);

        const view = await renderDetail('post-1', CURRENT_USER);

        await act(async () => { await Promise.resolve(); });

        // Set textarea value via native setter so React picks up the change
        const textarea = view.container.querySelector('textarea');
        expect(textarea).not.toBeNull();

        const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        await act(async () => {
            valueSetter.call(textarea, 'My new comment');
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
        });

        await act(async () => {
            textarea.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });

        await act(async () => { await Promise.resolve(); });

        expect(apiMocks.createComment).toHaveBeenCalledWith('post-1', 'My new comment');
        expect(view.container.textContent).toContain('My new comment');

        await view.cleanup();
    });

    it('shows like count and like button after post loads', async () => {
        clientMock.default.get.mockResolvedValue(STUB_POST);
        apiMocks.listComments.mockResolvedValue([]);
        apiMocks.getLikes.mockResolvedValue({ count: 3, likedByMe: false });

        const view = await renderDetail('post-1', CURRENT_USER);

        await act(async () => { await Promise.resolve(); });

        const likeBtn = view.container.querySelector('[aria-label="Like post"]');
        expect(likeBtn).not.toBeNull();
        expect(view.container.textContent).toContain('3');

        await view.cleanup();
    });

    it('toggles the like optimistically when the like button is clicked', async () => {
        clientMock.default.get.mockResolvedValue(STUB_POST);
        apiMocks.listComments.mockResolvedValue([]);
        apiMocks.getLikes.mockResolvedValue({ count: 2, likedByMe: false });
        apiMocks.toggleLike.mockResolvedValue({ count: 3, likedByMe: true });

        const view = await renderDetail('post-1', CURRENT_USER);

        await act(async () => { await Promise.resolve(); });

        const likeBtn = view.container.querySelector('[aria-label="Like post"]');
        await act(async () => { likeBtn.click(); });
        await act(async () => { await Promise.resolve(); });

        expect(apiMocks.toggleLike).toHaveBeenCalledWith('post-1');
        expect(view.container.querySelector('[aria-label="Unlike post"]')).not.toBeNull();
        expect(view.container.textContent).toContain('3');

        await view.cleanup();
    });
});
