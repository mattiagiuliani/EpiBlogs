import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findOneAndUpdateMock } = vi.hoisted(() => ({
    findOneAndUpdateMock: vi.fn()
}));

vi.mock('../../backend/models/RateLimitEntry.js', () => ({
    default: {
        findOneAndUpdate: findOneAndUpdateMock
    }
}));

import {
    createGoogleExchangeRateLimit,
    createLoginRateLimit,
    createRateLimit
} from '../../backend/middlewares/rateLimit.js';

const createResponse = () => ({
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis()
});

describe('rate limit middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('allows requests under the limit', async () => {
        const middleware = createRateLimit({
            keyPrefix: 'test',
            maxRequests: 2,
            message: 'Too many requests',
            windowMs: 60_000
        });
        const request = {
            headers: {},
            ip: '127.0.0.1'
        };
        const response = createResponse();
        const next = vi.fn();

        findOneAndUpdateMock
            .mockResolvedValueOnce({ count: 1 })
            .mockResolvedValueOnce({ count: 2 });

        await middleware(request, response, next);
        await middleware(request, response, next);

        expect(next).toHaveBeenCalledTimes(2);
        expect(response.status).not.toHaveBeenCalled();
    });

    it('blocks requests that exceed the limit', async () => {
        const middleware = createRateLimit({
            keyPrefix: 'test',
            maxRequests: 1,
            message: 'Too many requests',
            windowMs: 60_000
        });
        const request = {
            headers: {},
            ip: '127.0.0.1'
        };
        const response = createResponse();
        const next = vi.fn();

        findOneAndUpdateMock
            .mockResolvedValueOnce({ count: 1 })
            .mockResolvedValueOnce({ count: 2 });

        await middleware(request, response, next);
        await middleware(request, response, next);

        expect(response.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
        expect(response.status).toHaveBeenCalledWith(429);
        expect(response.send).toHaveBeenCalledWith({ message: 'Too many requests' });
    });

    it('uses request.ip as the client key (trust proxy resolves the real address)', async () => {
        const middleware = createLoginRateLimit();
        // Express populates request.ip after applying the trust proxy setting.
        // When trust proxy is configured it resolves to the client address from
        // x-forwarded-for; otherwise it is the direct socket address. Either way
        // the rate limiter uses request.ip so the header cannot be spoofed.
        const request = {
            headers: {},
            ip: '203.0.113.10'
        };
        const response = createResponse();
        const next = vi.fn();

        findOneAndUpdateMock.mockResolvedValueOnce({ count: 1 });

        await middleware(request, response, next);

        expect(next).toHaveBeenCalledOnce();
        expect(findOneAndUpdateMock).toHaveBeenCalledWith(
            { key: expect.stringContaining('login:203.0.113.10:') },
            expect.any(Object),
            expect.objectContaining({
                returnDocument: 'after',
                upsert: true
            })
        );
    });

    it('creates the Google exchange limiter without throwing', () => {
        expect(createGoogleExchangeRateLimit()).toBeTypeOf('function');
    });

    it('fails open when the rate limit store throws', async () => {
        const middleware = createRateLimit({
            keyPrefix: 'test',
            maxRequests: 1,
            message: 'Too many requests',
            windowMs: 60_000
        });
        const request = {
            headers: {},
            ip: '127.0.0.1'
        };
        const response = createResponse();
        const next = vi.fn();

        findOneAndUpdateMock.mockRejectedValueOnce(new Error('db unavailable'));

        await middleware(request, response, next);

        expect(next).toHaveBeenCalledOnce();
        expect(response.status).not.toHaveBeenCalled();
    });
});
