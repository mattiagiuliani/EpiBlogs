// @vitest-environment jsdom
import * as React from '../../frontend/node_modules/react/index.js';
import { act } from '../../frontend/node_modules/react/index.js';
import { createRoot } from '../../frontend/node_modules/react-dom/client.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
    getAuthorById: vi.fn(),
    updateAuthor: vi.fn(),
    uploadAuthorAvatar: vi.fn(),
}));

vi.mock('../../frontend/src/assets/api.js', () => apiMocks);

const { default: ProfilePage } = await import('../../frontend/src/ProfilePage.jsx');

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
    const prototype = element.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    await act(async () => {
        valueSetter.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    });
};

describe('ProfilePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
        apiMocks.getAuthorById.mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com',
            firstName: 'Mario',
            lastName: 'Rossi',
            profile: 'Existing bio',
            birthDate: '1992-07-14T00:00:00.000Z',
            avatar: 'https://cdn.example/current.jpg'
        });
        apiMocks.updateAuthor.mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            email: 'author@example.com',
            firstName: 'Mario',
            lastName: 'Rossi',
            profile: 'Updated bio',
            birthDate: '1993-08-01T00:00:00.000Z',
            avatar: 'https://cdn.example/current.jpg'
        });
        apiMocks.uploadAuthorAvatar.mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            avatar: 'https://cdn.example/uploaded.jpg'
        });
    });

    it('loads the current author profile and renders readonly email', async () => {
        const view = await renderComponent(
            React.createElement(ProfilePage, {
                currentUser: {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'author@example.com'
                },
                onLogout: vi.fn(),
                onNavigate: vi.fn()
            })
        );

        await act(async () => {
            await Promise.resolve();
        });

        expect(apiMocks.getAuthorById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        expect(view.container.querySelector('#profile-email').value).toBe('author@example.com');
        expect(view.container.querySelector('#profile-email').readOnly).toBe(true);
        expect(view.container.querySelector('#profile-bio').value).toBe('Existing bio');
        expect(view.container.querySelector('#profile-birthDate').value).toBe('1992-07-14');

        await view.cleanup();
    });

    it('updates profile text fields without changing email', async () => {
        const onProfileUpdated = vi.fn();
        const view = await renderComponent(
            React.createElement(ProfilePage, {
                currentUser: {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'author@example.com'
                },
                onLogout: vi.fn(),
                onNavigate: vi.fn(),
                onProfileUpdated
            })
        );

        await act(async () => {
            await Promise.resolve();
        });

        await changeInput(view.container.querySelector('#profile-bio'), 'Updated bio');
        await changeInput(view.container.querySelector('#profile-birthDate'), '1993-08-01');

        await act(async () => {
            view.container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });

        expect(apiMocks.updateAuthor).toHaveBeenCalledWith(
            '507f1f77bcf86cd799439011',
            {
                profile: 'Updated bio',
                birthDate: '1993-08-01T00:00:00.000Z'
            }
        );
        expect(onProfileUpdated).toHaveBeenCalledWith(expect.objectContaining({
            profile: 'Updated bio',
            birthDate: '1993-08-01T00:00:00.000Z'
        }));
        expect(view.container.textContent).toContain('Profile updated successfully.');

        await view.cleanup();
    });

    it('uploads a new avatar before saving profile changes', async () => {
        const view = await renderComponent(
            React.createElement(ProfilePage, {
                currentUser: {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'author@example.com'
                },
                onLogout: vi.fn(),
                onNavigate: vi.fn()
            })
        );

        await act(async () => {
            await Promise.resolve();
        });

        const input = view.container.querySelector('#profile-avatar-input');
        const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

        await act(async () => {
            Object.defineProperty(input, 'files', {
                configurable: true,
                value: [file]
            });
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });

        await act(async () => {
            view.container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });

        expect(apiMocks.uploadAuthorAvatar).toHaveBeenCalledWith('507f1f77bcf86cd799439011', file);
        expect(apiMocks.updateAuthor).toHaveBeenCalled();

        await view.cleanup();
    });

    it('removes the avatar through the regular update endpoint', async () => {
        const view = await renderComponent(
            React.createElement(ProfilePage, {
                currentUser: {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'author@example.com'
                },
                onLogout: vi.fn(),
                onNavigate: vi.fn()
            })
        );

        await act(async () => {
            await Promise.resolve();
        });

        await act(async () => {
            const button = Array.from(view.container.querySelectorAll('button')).find((item) => item.textContent.includes('Remove image'));
            button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });

        await act(async () => {
            view.container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });

        expect(apiMocks.updateAuthor).toHaveBeenCalledWith(
            '507f1f77bcf86cd799439011',
            expect.objectContaining({ avatar: '' })
        );

        await view.cleanup();
    });

    it('rejects non-image avatar files before submit', async () => {
        const view = await renderComponent(
            React.createElement(ProfilePage, {
                currentUser: {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'author@example.com'
                },
                onLogout: vi.fn(),
                onNavigate: vi.fn()
            })
        );

        await act(async () => {
            await Promise.resolve();
        });

        const input = view.container.querySelector('#profile-avatar-input');
        const file = new File(['text'], 'note.txt', { type: 'text/plain' });

        await act(async () => {
            Object.defineProperty(input, 'files', {
                configurable: true,
                value: [file]
            });
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });

        expect(view.container.textContent).toContain('Avatar must be an image file.');
        expect(apiMocks.uploadAuthorAvatar).not.toHaveBeenCalled();

        await view.cleanup();
    });

    it('rejects avatar files larger than 5MB', async () => {
        const view = await renderComponent(
            React.createElement(ProfilePage, {
                currentUser: {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'author@example.com'
                },
                onLogout: vi.fn(),
                onNavigate: vi.fn()
            })
        );

        await act(async () => {
            await Promise.resolve();
        });

        const input = view.container.querySelector('#profile-avatar-input');
        const file = new File(['avatar'], 'large.png', { type: 'image/png' });

        Object.defineProperty(file, 'size', {
            configurable: true,
            value: 5 * 1024 * 1024 + 1
        });

        await act(async () => {
            Object.defineProperty(input, 'files', {
                configurable: true,
                value: [file]
            });
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });

        expect(view.container.textContent).toContain('Avatar image must be 5MB or smaller.');
        expect(apiMocks.uploadAuthorAvatar).not.toHaveBeenCalled();

        await view.cleanup();
    });
});