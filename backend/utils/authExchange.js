import { randomBytes } from 'node:crypto';
import AuthCode from '../models/AuthCode.js';

const AUTH_CODE_TTL_MS = 60 * 1000;

export const createAuthCode = async (payload) => {
    const code = randomBytes(32).toString('base64url');

    await AuthCode.create({
        code,
        expiresAt: new Date(Date.now() + AUTH_CODE_TTL_MS),
        payload
    });

    return code;
};

export const consumeAuthCode = async (code) => {
    if (typeof code !== 'string' || !code) {
        return null;
    }

    const entry = await AuthCode.findOneAndDelete({
        code,
        expiresAt: { $gt: new Date() }
    }).lean();

    if (!entry) {
        return null;
    }

    return entry.payload;
};

export const getAuthCodeTtlMs = () => AUTH_CODE_TTL_MS;
