import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildCorsOptions, getAllowedCorsOrigins } from '../../backend/utils/cors.js';

describe('cors config', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalGoogleEnv = process.env.GOOGLE_ENV;

    afterEach(() => {
        delete process.env.CORS_ALLOW_CREDENTIALS;
        delete process.env.CORS_ALLOWED_ORIGINS;
        delete process.env.FRONTEND_URL;
        delete process.env.DEVELOPMENT_FRONTEND_URL;
        delete process.env.DEPLOYMENT_FRONTEND_URL;
        process.env.NODE_ENV = originalNodeEnv;
        process.env.GOOGLE_ENV = originalGoogleEnv;
    });

    it('includes FRONTEND_URL and additional configured origins', () => {
        process.env.FRONTEND_URL = 'https://frontend.example.com';
        process.env.CORS_ALLOWED_ORIGINS = 'https://admin.example.com, https://app.example.com';

        expect(getAllowedCorsOrigins()).toEqual([
            'https://frontend.example.com',
            'https://admin.example.com',
            'https://app.example.com'
        ]);
    });

    it('allows requests without origin and configured origins', () => {
        process.env.FRONTEND_URL = 'https://frontend.example.com';
        const corsOptions = buildCorsOptions();
        const callback = vi.fn();

        corsOptions.origin(undefined, callback);
        corsOptions.origin('https://frontend.example.com', callback);
        corsOptions.origin('https://evil.example.com', callback);

        expect(callback).toHaveBeenNthCalledWith(1, null, true);
        expect(callback).toHaveBeenNthCalledWith(2, null, true);
        expect(callback).toHaveBeenNthCalledWith(3, null, false);
    });

    it('uses DEVELOPMENT_FRONTEND_URL when FRONTEND_URL is not set in development', () => {
        process.env.NODE_ENV = 'development';
        process.env.DEVELOPMENT_FRONTEND_URL = 'http://localhost:5173';
        process.env.DEPLOYMENT_FRONTEND_URL = 'https://frontend.prod.example.com';

        expect(getAllowedCorsOrigins()).toEqual(['http://localhost:5173']);
    });

    it('uses DEPLOYMENT_FRONTEND_URL in production when FRONTEND_URL is not set', () => {
        process.env.NODE_ENV = 'production';
        process.env.DEVELOPMENT_FRONTEND_URL = 'http://localhost:5173';
        process.env.DEPLOYMENT_FRONTEND_URL = 'https://frontend.prod.example.com';

        expect(getAllowedCorsOrigins()).toEqual(['https://frontend.prod.example.com']);
    });

    it('includes PATCH in allowed methods', () => {
        process.env.FRONTEND_URL = 'https://frontend.example.com';
        const corsOptions = buildCorsOptions();

        expect(corsOptions.methods).toContain('PATCH');
    });

    it('allows localhost origins on arbitrary ports in development', () => {
        process.env.NODE_ENV = 'development';
        process.env.FRONTEND_URL = 'http://localhost:5173';
        const corsOptions = buildCorsOptions();
        const callback = vi.fn();

        corsOptions.origin('http://localhost:5175', callback);
        expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('does not allow arbitrary localhost ports in production unless explicitly whitelisted', () => {
        process.env.NODE_ENV = 'production';
        process.env.FRONTEND_URL = 'https://frontend.example.com';
        const corsOptions = buildCorsOptions();
        const callback = vi.fn();

        corsOptions.origin('http://localhost:5175', callback);
        expect(callback).toHaveBeenCalledWith(null, false);
    });
});
