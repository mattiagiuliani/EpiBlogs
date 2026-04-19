import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import app from '../../backend/app.js';

describe('app CORS preflight', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalGoogleEnv = process.env.GOOGLE_ENV;
    const originalFrontendUrl = process.env.FRONTEND_URL;
    const originalDevFrontendUrl = process.env.DEVELOPMENT_FRONTEND_URL;
    const originalDeploymentFrontendUrl = process.env.DEPLOYMENT_FRONTEND_URL;

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
        process.env.GOOGLE_ENV = originalGoogleEnv;

        if (originalFrontendUrl === undefined) delete process.env.FRONTEND_URL;
        else process.env.FRONTEND_URL = originalFrontendUrl;

        if (originalDevFrontendUrl === undefined) delete process.env.DEVELOPMENT_FRONTEND_URL;
        else process.env.DEVELOPMENT_FRONTEND_URL = originalDevFrontendUrl;

        if (originalDeploymentFrontendUrl === undefined) delete process.env.DEPLOYMENT_FRONTEND_URL;
        else process.env.DEPLOYMENT_FRONTEND_URL = originalDeploymentFrontendUrl;
    });

    it('returns PATCH in Access-Control-Allow-Methods for avatar upload preflight', async () => {
        process.env.NODE_ENV = 'development';
        process.env.DEVELOPMENT_FRONTEND_URL = 'http://localhost:5173';

        const response = await request(app)
            .options('/api/v1/authors/507f1f77bcf86cd799439011/avatar')
            .set('Origin', 'http://localhost:5173')
            .set('Access-Control-Request-Method', 'PATCH');

        expect(response.status).toBe(204);
        expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
        expect(response.headers['access-control-allow-methods']).toContain('PATCH');
    });
});
