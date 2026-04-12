// @vitest-environment jsdom
import * as React from '../../frontend/node_modules/react/index.js';
import { act } from '../../frontend/node_modules/react/index.js';
import { createRoot } from '../../frontend/node_modules/react-dom/client.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
    apiPaths: {
        authors: '/api/v1/authors',
        posts: '/api/v1/posts'
    },
    deletePost: vi.fn(),
    fetchJson: vi.fn(),
    updatePost: vi.fn()
}));

const createPostMock = vi.hoisted(() => vi.fn());

vi.mock('../../frontend/src/assets/api.js', () => apiMocks);
vi.mock('../../frontend/src/assets/createPostFetch.js', () => ({
    createPost: createPostMock
}));

const { default: AuthorList } = await import('../../frontend/src/AuthorList.jsx');
const { default: CreatePost } = await import('../../frontend/src/Form.jsx');
const { default: PostList } = await import('../../frontend/src/PostList.jsx');
const { default: SearchPost } = await import('../../frontend/src/SearchPost.jsx');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const renderComponent = async (element) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(element);
    });

    return {
        container,
        cleanup: async () => {
            await act(async () => {
                root.unmount();
            });
            container.remove();
        }
    };
};

const changeInput = async (element, value) => {
    const prototype = element.tagName === 'SELECT'
        ? window.HTMLSelectElement.prototype
        : element.tagName === 'TEXTAREA'
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    await act(async () => {
        valueSetter.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    });
};

describe('frontend domain components', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('submits the create-post form for the authenticated author', async () => {
        createPostMock.mockResolvedValue({ _id: 'post-id' });
        const onCreated = vi.fn();
        const view = await renderComponent(
            React.createElement(CreatePost, {
                currentUser: {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'author@example.com',
                    firstName: 'Mario',
                    lastName: 'Rossi'
                },
                onCreated
            })
        );

        await changeInput(view.container.querySelector('input[name="category"]'), 'Tech');
        await changeInput(view.container.querySelector('input[name="title"]'), 'New article');
        await changeInput(view.container.querySelector('input[name="cover"]'), 'https://example.com/cover.jpg');
        await changeInput(view.container.querySelector('input[name="readTimeValue"]'), '5');
        await changeInput(view.container.querySelector('textarea[name="content"]'), 'Post body');

        await act(async () => {
            view.container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });

        expect(createPostMock).toHaveBeenCalledWith({
            author: '507f1f77bcf86cd799439011',
            category: 'Tech',
            content: 'Post body',
            cover: 'https://example.com/cover.jpg',
            readTime: {
                unit: 'min',
                value: 5
            },
            title: 'New article'
        });
        expect(onCreated).toHaveBeenCalledWith({ _id: 'post-id' });
        expect(view.container.textContent).toContain('Post created successfully.');

        await view.cleanup();
    });

    it('shows an error when create-post submission fails', async () => {
        createPostMock.mockRejectedValue(new Error('Create failed'));
        const view = await renderComponent(
            React.createElement(CreatePost, {
                currentUser: {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'author@example.com'
                }
            })
        );

        await changeInput(view.container.querySelector('input[name="category"]'), 'Tech');
        await changeInput(view.container.querySelector('input[name="title"]'), 'Broken article');
        await changeInput(view.container.querySelector('input[name="cover"]'), 'https://example.com/cover.jpg');
        await changeInput(view.container.querySelector('input[name="readTimeValue"]'), '5');
        await changeInput(view.container.querySelector('textarea[name="content"]'), 'Post body');

        await act(async () => {
            view.container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });

        expect(view.container.textContent).toContain('Create failed');

        await view.cleanup();
    });

    it('loads and renders posts, then searches again via the search form', async () => {
        apiMocks.fetchJson
            .mockResolvedValueOnce({
                data: [{
                    _id: 'post-1',
                    authorEmail: 'author@example.com',
                    category: 'Tech',
                    content: '<p>Hello world</p>',
                    readTime: { unit: 'min', value: 5 },
                    title: 'First Post'
                }],
                total: 1,
                page: 1,
                limit: 20,
                totalPages: 1
            })
            .mockResolvedValueOnce({
                data: [{
                    _id: 'post-2',
                    authorEmail: 'author@example.com',
                    category: 'News',
                    content: 'Second body',
                    readTime: { unit: 'min', value: 3 },
                    title: 'Second Post'
                }],
                total: 1,
                page: 1,
                limit: 20,
                totalPages: 1
            });

        const view = await renderComponent(
            React.createElement(PostList, { currentUser: null, refreshToken: 0 })
        );

        await act(async () => {
            await Promise.resolve();
        });

        expect(apiMocks.fetchJson).toHaveBeenCalledWith(
            '/api/v1/posts?search=&page=1&limit=20',
            {},
            'Error fetching posts'
        );
        expect(view.container.textContent).toContain('First Post');
        expect(view.container.textContent).toContain('Hello world');

        await changeInput(view.container.querySelector('input[aria-label="Search posts by title"]'), 'second');

        await act(async () => {
            view.container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            await Promise.resolve();
        });

        expect(apiMocks.fetchJson).toHaveBeenLastCalledWith(
            '/api/v1/posts?search=second&page=1&limit=20',
            {},
            'Error fetching posts'
        );
        expect(view.container.textContent).toContain('Second Post');

        await view.cleanup();
    });

    it('shows an error when posts cannot be loaded', async () => {
        apiMocks.fetchJson.mockRejectedValue(new Error('Posts failed'));
        const view = await renderComponent(
            React.createElement(PostList, { currentUser: null, refreshToken: 0 })
        );

        await act(async () => {
            await Promise.resolve();
        });

        expect(view.container.textContent).toContain('Posts failed');

        await view.cleanup();
    });

    it('shows edit and delete buttons only for posts owned by the authenticated author', async () => {
        apiMocks.fetchJson.mockResolvedValue({
            data: [
                {
                    _id: 'post-1',
                    author: '507f1f77bcf86cd799439011',
                    authorEmail: 'owner@example.com',
                    category: 'Tech',
                    content: 'Owned content',
                    readTime: { unit: 'min', value: 5 },
                    title: 'Owned Post'
                },
                {
                    _id: 'post-2',
                    author: '507f1f77bcf86cd799439012',
                    authorEmail: 'other@example.com',
                    category: 'News',
                    content: 'Other content',
                    readTime: { unit: 'min', value: 3 },
                    title: 'Other Post'
                }
            ],
            totalPages: 1
        });

        const view = await renderComponent(
            React.createElement(PostList, {
                currentUser: {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'owner@example.com'
                },
                refreshToken: 0
            })
        );

        await act(async () => {
            await Promise.resolve();
        });

        const editButtons = Array.from(view.container.querySelectorAll('button')).filter(
            (element) => element.textContent === 'Edit'
        );
        const deleteButtons = Array.from(view.container.querySelectorAll('button')).filter(
            (element) => element.textContent === 'Delete'
        );

        expect(editButtons).toHaveLength(1);
        expect(deleteButtons).toHaveLength(1);

        await view.cleanup();
    });

    it('updates an owned post and refreshes the list', async () => {
        apiMocks.fetchJson
            .mockResolvedValueOnce({
                data: [{
                    _id: 'post-1',
                    author: '507f1f77bcf86cd799439011',
                    authorEmail: 'owner@example.com',
                    category: 'Tech',
                    content: 'Owned content',
                    cover: 'https://example.com/cover.jpg',
                    readTime: { unit: 'min', value: 5 },
                    title: 'Owned Post'
                }],
                totalPages: 1
            })
            .mockResolvedValueOnce({
                data: [{
                    _id: 'post-1',
                    author: '507f1f77bcf86cd799439011',
                    authorEmail: 'owner@example.com',
                    category: 'Tech',
                    content: 'Updated content',
                    cover: 'https://example.com/cover.jpg',
                    readTime: { unit: 'min', value: 6 },
                    title: 'Updated Post'
                }],
                totalPages: 1
            });
        apiMocks.updatePost.mockResolvedValue({ _id: 'post-1' });
        const onPostsChanged = vi.fn();

        const view = await renderComponent(
            React.createElement(PostList, {
                currentUser: {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'owner@example.com'
                },
                onPostsChanged,
                refreshToken: 0
            })
        );

        await act(async () => {
            await Promise.resolve();
        });

        const editButton = Array.from(view.container.querySelectorAll('button')).find(
            (element) => element.textContent === 'Edit'
        );

        await act(async () => {
            editButton.click();
        });

        await changeInput(view.container.querySelector('input[name="title"]'), 'Updated Post');
        await changeInput(view.container.querySelector('input[name="readTimeValue"]'), '6');
        await changeInput(view.container.querySelector('textarea[name="content"]'), 'Updated content');

        await act(async () => {
            const saveButton = Array.from(view.container.querySelectorAll('button')).find(
                (element) => element.textContent === 'Save'
            );
            saveButton.click();
            await Promise.resolve();
        });

        expect(apiMocks.updatePost).toHaveBeenCalledWith('post-1', {
            category: 'Tech',
            content: 'Updated content',
            cover: 'https://example.com/cover.jpg',
            readTime: {
                unit: 'min',
                value: 6
            },
            title: 'Updated Post'
        });
        expect(onPostsChanged).toHaveBeenCalledTimes(1);
        expect(view.container.textContent).toContain('Updated Post');

        await view.cleanup();
    });

    it('deletes an owned post and refreshes the list', async () => {
        apiMocks.fetchJson
            .mockResolvedValueOnce({
                data: [{
                    _id: 'post-1',
                    author: '507f1f77bcf86cd799439011',
                    authorEmail: 'owner@example.com',
                    category: 'Tech',
                    content: 'Owned content',
                    readTime: { unit: 'min', value: 5 },
                    title: 'Owned Post'
                }],
                totalPages: 1
            })
            .mockResolvedValueOnce({
                data: [],
                totalPages: 1
            });
        apiMocks.deletePost.mockResolvedValue({ message: 'post deleted' });
        const onPostsChanged = vi.fn();
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

        const view = await renderComponent(
            React.createElement(PostList, {
                currentUser: {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'owner@example.com'
                },
                onPostsChanged,
                refreshToken: 0
            })
        );

        await act(async () => {
            await Promise.resolve();
        });

        const deleteButton = Array.from(view.container.querySelectorAll('button')).find(
            (element) => element.textContent === 'Delete'
        );

        await act(async () => {
            deleteButton.click();
            await Promise.resolve();
        });

        expect(apiMocks.deletePost).toHaveBeenCalledWith('post-1');
        expect(onPostsChanged).toHaveBeenCalledTimes(1);
        expect(view.container.textContent).toContain('No posts found');

        confirmSpy.mockRestore();
        await view.cleanup();
    });

    it('loads and renders authors, then refreshes them', async () => {
        apiMocks.fetchJson
            .mockResolvedValueOnce({
                data: [{
                    _id: 'author-1',
                    email: 'author@example.com',
                    firstName: 'Mario',
                    lastName: 'Rossi',
                    profile: 'Editor'
                }]
            })
            .mockResolvedValueOnce({
                data: [{
                    _id: 'author-2',
                    email: 'luigi@example.com',
                    firstName: 'Luigi',
                    lastName: 'Verdi'
                }]
            });

        const view = await renderComponent(React.createElement(AuthorList));

        await act(async () => {
            await Promise.resolve();
        });

        expect(apiMocks.fetchJson).toHaveBeenCalledWith('/api/v1/authors', {}, 'Error fetching authors');
        expect(view.container.textContent).toContain('Mario Rossi');
        expect(view.container.textContent).toContain('Editor');

        const refreshButton = Array.from(view.container.querySelectorAll('button')).find(
            (element) => element.textContent === 'Refresh'
        );

        await act(async () => {
            refreshButton.click();
            await Promise.resolve();
        });

        expect(view.container.textContent).toContain('Luigi Verdi');

        await view.cleanup();
    });

    it('submits and clears search queries', async () => {
        const onSearch = vi.fn();
        const view = await renderComponent(
            React.createElement(SearchPost, { onSearch })
        );

        const searchInput = view.container.querySelector('input[aria-label="Search posts by title"]');

        await changeInput(searchInput, 'react');

        await act(async () => {
            view.container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });

        expect(onSearch).toHaveBeenCalledWith('react');

        const clearButton = Array.from(view.container.querySelectorAll('button')).find(
            (element) => element.textContent === 'Clear'
        );

        await act(async () => {
            clearButton.click();
        });

        expect(searchInput.value).toBe('');
        expect(onSearch).toHaveBeenLastCalledWith('');

        await view.cleanup();
    });
});
