export const registerPaths = ['/api/v1/auth/register'];
export const loginPaths = ['/api/v1/auth/login'];
export const logoutPaths = ['/api/v1/auth/logout'];
export const mePaths = ['/api/v1/auth/me'];
export const googleAuthPaths = ['/api/v1/auth/google'];
// Both callback paths are kept: Google Console registrations may still use the
// non-versioned URL. Update DEVELOPMENT/DEPLOYMENT_GOOGLE_CALLBACK_URL to the
// /api/v1 path on new setups; existing setups can migrate when convenient.
export const googleCallbackPaths = ['/auth/google/callback', '/api/v1/auth/google/callback'];
export const googleExchangePaths = ['/api/v1/auth/google/exchange-code'];
