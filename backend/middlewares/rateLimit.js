import RateLimitEntry from '../models/RateLimitEntry.js';

const resolveClientKey = (request) => {
    const forwardedFor = request.headers['x-forwarded-for'];

    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
        return forwardedFor.split(',')[0].trim();
    }

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
                    new: true,
                    upsert: true
                }
            );

            if (currentEntry.count > maxRequests) {
                const retryAfterSeconds = Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000));
                response.setHeader('Retry-After', retryAfterSeconds.toString());
                return response.status(429).send({ message });
            }
        } catch {
            // Keep auth flows available if the limiter store is temporarily unavailable.
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
