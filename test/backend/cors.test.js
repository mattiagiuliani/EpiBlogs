import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildCorsOptions, getAllowedCorsOrigins } from '../../backend/utils/cors.js';

describe('cors config', () => {
    afterEach(() => {
        delete process.env.CORS_ALLOW_CREDENTIALS;
        delete process.env.CORS_ALLOWED_ORIGINS;
        delete process.env.FRONTEND_URL;
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
});
