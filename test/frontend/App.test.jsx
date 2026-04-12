// @vitest-environment jsdom
import * as React from '../../frontend/node_modules/react/index.js';
import { act } from '../../frontend/node_modules/react/index.js';
import { createRoot } from '../../frontend/node_modules/react-dom/client.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
    clearStoredAuthToken: vi.fn(),
    exchangeGoogleAuthCode: vi.fn(),
    getGoogleLoginUrl: vi.fn().mockReturnValue('http://localhost:3000/auth/google'),
    getMe: vi.fn(),
    login: vi.fn(),
    normalizeAuthenticatedUser: vi.fn((user) => user),
    logoutApi: vi.fn(),
    register: vi.fn(),
    UNAUTHORIZED_EVENT: 'epiblogs:unauthorized'
}));

vi.mock('../../frontend/src/assets/api.js', () => apiMocks);
vi.mock('../../frontend/src/Form.jsx', () => ({
    default: () => 'CreatePost mock'
}));
vi.mock('../../frontend/src/List.jsx', () => ({
    default: () => 'List mock'
}));
vi.mock('../../frontend/src/AuthPage.jsx', () => ({
    default: ({ mode }) => `${mode === 'login' ? 'Login page' : 'Register page'}`
}));

const { default: App } = await import('../../frontend/src/App.jsx');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const renderApp = async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(React.createElement(App));
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

describe('App', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
        window.history.replaceState({}, '', '/');
    });

    it('redirects unauthenticated users to the login page', async () => {
        apiMocks.getMe.mockRejectedValue(new Error('Unauthorized'));

        const view = await renderApp();

        await act(async () => {
            await Promise.resolve();
        });

        expect(view.container.textContent).toContain('Login page');
        expect(window.location.pathname).toBe('/login');

        await view.cleanup();
    });

    it('loads the authenticated dashboard when a session cookie is active', async () => {
        apiMocks.getMe.mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            email: 'mario@example.com'
        });

        const view = await renderApp();

        await act(async () => {
            await Promise.resolve();
        });

        expect(view.container.textContent).toContain('EpiBlogs Dashboard');
        expect(view.container.textContent).toContain('CreatePost mock');
        expect(view.container.textContent).toContain('List mock');
        expect(view.container.textContent).toContain('mario@example.com');

        await view.cleanup();
    });

    it('hydrates auth state immediately after the Google callback exchange', async () => {
        window.history.replaceState({}, '', '/auth/callback?code=oauth-code');
        apiMocks.exchangeGoogleAuthCode.mockResolvedValue({
            token: 'jwt-token',
            author: {
                _id: '507f1f77bcf86cd799439011',
                email: 'mario@example.com'
            }
        });

        const view = await renderApp();

        await act(async () => {
            await Promise.resolve();
        });

        expect(apiMocks.exchangeGoogleAuthCode).toHaveBeenCalledWith('oauth-code');
        expect(view.container.textContent).toContain('EpiBlogs Dashboard');
        expect(window.location.pathname).toBe('/');

        await view.cleanup();
    });
});
