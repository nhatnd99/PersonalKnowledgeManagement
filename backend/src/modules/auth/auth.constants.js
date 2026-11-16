import { env } from '../../config/env.js';

export const COOKIE_NAME = env.sessionCookieName || 'knowledge_session';

/**
 * Build standard Express cookie options for session management.
 *
 * @param {Date} [expiresAt] - Expiration timestamp
 * @returns {import('express').CookieOptions}
 */
export function buildCookieOptions(expiresAt) {
  const options = {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
  };

  if (env.cookieDomain) {
    options.domain = env.cookieDomain;
  }

  if (expiresAt) {
    options.expires = expiresAt;
  }

  return options;
}
