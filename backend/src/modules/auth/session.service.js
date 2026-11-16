import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';

/**
 * Service handling session lifecycle: creation, hashing, validation, and revocation.
 */

/**
 * Hash raw token with SHA-256.
 *
 * @param {string} token - Raw cryptographically random token
 * @returns {string} SHA-256 hash in hex
 */
export function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a new cryptographically secure session.
 *
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {boolean} [params.rememberMe=false] - Whether to use extended session lifetime
 * @param {string} [params.userAgent] - Request User-Agent header
 * @param {string} [params.ipAddress] - Request IP
 * @param {string} [params.deviceName] - Parsed or provided device name
 * @returns {Promise<{ session: Object, rawToken: string, expiresAt: Date }>}
 */
export async function createSession({ userId, rememberMe = false, userAgent = null, ipAddress = null, deviceName = null }) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(rawToken);

  const durationMs = rememberMe ? env.sessionRememberDurationMs : env.sessionDurationMs;
  const expiresAt = new Date(Date.now() + durationMs);

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash,
      userAgent: userAgent ? userAgent.substring(0, 500) : null,
      ipAddress: ipAddress ? ipAddress.substring(0, 45) : null,
      deviceName: deviceName || (userAgent ? parseDeviceFromUserAgent(userAgent) : 'Web Session'),
      expiresAt,
    },
  });

  return { session, rawToken, expiresAt };
}

/**
 * Validate a raw session token.
 *
 * @param {string} rawToken - Session token from cookie or header
 * @returns {Promise<{ session: Object, user: Object } | null>}
 */
export async function validateSession(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return null;

  const tokenHash = hashSessionToken(rawToken);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return null;
  }

  // Throttled last activity update (every 60 seconds)
  const now = Date.now();
  if (now - new Date(session.lastActivityAt).getTime() > 60 * 1000) {
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    }).catch(() => {});
  }

  return {
    session,
    user: session.user,
  };
}

/**
 * Revoke a single session by its raw token.
 *
 * @param {string} rawToken
 */
export async function revokeSessionByToken(rawToken) {
  if (!rawToken) return;
  const tokenHash = hashSessionToken(rawToken);
  await prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Revoke an individual session by its ID for a specific user.
 *
 * @param {string} sessionId
 * @param {string} userId
 */
export async function revokeSessionById(sessionId, userId) {
  const result = await prisma.session.updateMany({
    where: {
      id: sessionId,
      userId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
  return result.count > 0;
}

/**
 * Revoke all active sessions for a user.
 *
 * @param {string} userId
 */
export async function revokeAllUserSessions(userId) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Revoke all sessions for a user except the current active session.
 *
 * @param {string} userId
 * @param {string} currentSessionId
 */
export async function revokeOtherUserSessions(userId, currentSessionId) {
  await prisma.session.updateMany({
    where: {
      userId,
      id: { not: currentSessionId },
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

/**
 * List active sessions for a user with safe metadata.
 *
 * @param {string} userId
 * @param {string} currentSessionId
 * @returns {Promise<Array<Object>>}
 */
export async function getUserSessions(userId, currentSessionId) {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActivityAt: 'desc' },
    select: {
      id: true,
      deviceName: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      lastActivityAt: true,
      expiresAt: true,
    },
  });

  return sessions.map((s) => ({
    ...s,
    isCurrent: s.id === currentSessionId,
  }));
}

/**
 * Helper to produce a human-friendly device name from User-Agent.
 */
function parseDeviceFromUserAgent(ua) {
  if (!ua) return 'Unknown Device';
  if (/mobile/i.test(ua)) return 'Mobile Browser';
  if (/tablet/i.test(ua) || /ipad/i.test(ua)) return 'Tablet Browser';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS Desktop';
  if (/windows/i.test(ua)) return 'Windows Desktop';
  if (/linux/i.test(ua)) return 'Linux Desktop';
  return 'Web Browser';
}
