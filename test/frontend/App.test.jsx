// @vitest-environment jsdom
import * as React from '../../frontend/node_modules/react/index.js';
import { act } from '../../frontend/node_modules/react/index.js';
import { createRoot } from '../../frontend/node_modules/react-dom/client.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
    clearStoredToken: vi.fn(),
    getMe: vi.fn(),
    getStoredToken: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    setStoredToken: vi.fn(),
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
        apiMocks.getStoredToken.mockReturnValue(null);

        const view = await renderApp();

        expect(view.container.textContent).toContain('Login page');
        expect(window.location.pathname).toBe('/login');

        await view.cleanup();
    });

    it('loads the authenticated dashboard when a token is present', async () => {
        apiMocks.getStoredToken.mockReturnValue('jwt-token');
        apiMocks.getMe.mockResolvedValue({
            firstName: 'Mario',
            lastName: 'Rossi',
            email: 'mario@example.com'
        });

        const view = await renderApp();

        await act(async () => {
            await Promise.resolve();
        });

        expect(view.container.textContent).toContain('EpiBlogs Dashboard');
        expect(view.container.textContent).toContain('CreatePost mock');
        expect(view.container.textContent).toContain('List mock');

        await view.cleanup();
    });
});
