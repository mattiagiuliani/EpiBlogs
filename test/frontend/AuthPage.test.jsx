// @vitest-environment jsdom
import * as React from '../../frontend/node_modules/react/index.js';
import { act } from '../../frontend/node_modules/react/index.js';
import { createRoot } from '../../frontend/node_modules/react-dom/client.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthPage from '../../frontend/src/AuthPage.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const renderComponent = async (props) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(React.createElement(AuthPage, props));
    });

    return {
        container,
        root,
        cleanup: async () => {
            await act(async () => {
                root.unmount();
            });
            container.remove();
        }
    };
};

const changeInput = async (element, value) => {
    const valueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
    )?.set;

    await act(async () => {
        valueSetter.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    });
};

describe('AuthPage', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('submits login credentials and resets the form after success', async () => {
        const onSubmit = vi.fn().mockResolvedValue(true);
        const view = await renderComponent({
            mode: 'login',
            onSubmit,
            onNavigate: vi.fn(),
            isSubmitting: false,
            errorMessage: '',
            successMessage: ''
        });

        const emailInput = view.container.querySelector('input[name="email"]');
        const passwordInput = view.container.querySelector('input[name="password"]');
        const form = view.container.querySelector('form');

        await changeInput(emailInput, 'author@example.com');
        await changeInput(passwordInput, 'secret123');

        await act(async () => {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });

        expect(onSubmit).toHaveBeenCalledWith({
            email: 'author@example.com',
            password: 'secret123'
        });
        expect(emailInput.value).toBe('');
        expect(passwordInput.value).toBe('');

        await view.cleanup();
    });

    it('renders registration fields and navigates back to login', async () => {
        const onNavigate = vi.fn();
        const view = await renderComponent({
            mode: 'register',
            onSubmit: vi.fn().mockResolvedValue(false),
            onNavigate,
            isSubmitting: false,
            errorMessage: 'Duplicate value',
            successMessage: ''
        });

        expect(view.container.querySelector('input[name="firstName"]')).not.toBeNull();
        expect(view.container.querySelector('input[name="lastName"]')).not.toBeNull();
        expect(view.container.querySelector('input[name="profile"]')).not.toBeNull();
        expect(view.container.textContent).toContain('Duplicate value');

        const button = Array.from(view.container.querySelectorAll('button')).find(
            (element) => element.textContent === 'Go to login'
        );

        await act(async () => {
            button.click();
        });

        expect(onNavigate).toHaveBeenCalledWith('/login');

        await view.cleanup();
    });
});
