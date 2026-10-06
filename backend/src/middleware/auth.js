'use strict';

const AppError = require('../utils/AppError');

/**
 * Verifies the Firebase ID token sent as "Authorization: Bearer <token>"
 * and attaches { uid, email, name } to req.user.
 *
 * @param {(token: string) => Promise<{uid: string, email?: string, name?: string}>} verifyToken
 */
function createRequireAuth(verifyToken) {
  return async function requireAuth(req, _res, next) {
    const header = req.get('authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return next(AppError.unauthorized());
    try {
      const decoded = await verifyToken(match[1].trim());
      if (!decoded?.uid) return next(AppError.unauthorized());
      req.user = { uid: decoded.uid, email: decoded.email || null, name: decoded.name || null };
      return next();
    } catch (err) {
      if (err instanceof AppError) return next(err);
      const expired = err?.code === 'auth/id-token-expired';
      return next(
        new AppError(
          401,
          expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
          expired ? 'Your session has expired. Please sign in again.' : 'Your sign-in could not be verified. Please sign in again.'
        )
      );
    }
  };
}

module.exports = { createRequireAuth };
