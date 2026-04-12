import RateLimitEntry from '../models/RateLimitEntry.js';

// Use request.ip, which Express resolves correctly based on the trust proxy setting.
// Reading x-forwarded-for directly would allow clients to spoof their IP and bypass
// rate limiting by cycling through fake addresses.
const resolveClientKey = (request) => {
    return request.ip || request.socket?.remoteAddress || 'unknown';
};

const resolveWindowStart = (now, windowMs) => Math.floor(now / windowMs) * windowMs;

export const createRateLimit = ({
    keyPrefix = 'rate-limit',
    maxRequests,
    message,
    windowMs
}) => {
    return async (request, response, next) => {
        const now = Date.now();
        const windowStart = resolveWindowStart(now, windowMs);
        const expiresAt = new Date(windowStart + windowMs);
        const clientKey = `${keyPrefix}:${resolveClientKey(request)}:${windowStart}`;

        try {
            const currentEntry = await RateLimitEntry.findOneAndUpdate(
                { key: clientKey },
                {
                    $inc: {
                        count: 1
                    },
                    $setOnInsert: {
                        expiresAt,
                        key: clientKey
                    }
                },
                {
                    returnDocument: 'after',
                    upsert: true
                }
            );

            if (currentEntry.count > maxRequests) {
                const retryAfterSeconds = Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000));
                response.setHeader('Retry-After', retryAfterSeconds.toString());
                return response.status(429).send({ message });
            }
        } catch {
            return next();
        }

        return next();
    };
};

export const createLoginRateLimit = () => createRateLimit({
    keyPrefix: 'login',
    maxRequests: 5,
    message: 'Too many login attempts. Please try again later.',
    windowMs: 60 * 1000
});

export const createGoogleExchangeRateLimit = () => createRateLimit({
    keyPrefix: 'google-exchange',
    maxRequests: 10,
    message: 'Too many Google auth exchange attempts. Please try again later.',
    windowMs: 60 * 1000
});
