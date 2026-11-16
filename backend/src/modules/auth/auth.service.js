import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import * as passwordService from './password.service.js';
import * as sessionService from './session.service.js';
import * as emailService from './email.service.js';

/**
 * Service managing user authentication, registration, password lifecycle, and sessions.
 */

/**
 * Format user entity into a safe public profile without sensitive hash or secrets.
 *
 * @param {Object} user
 * @returns {Object} Safe user object
 */
export function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName || user.name || 'Knowledge User',
    avatarUrl: user.avatarUrl || null,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || null,
  };
}

/**
 * Register a new user account.
 *
 * @param {Object} params
 * @param {string} params.email - User email
 * @param {string} params.password - Raw password
 * @param {string} [params.displayName] - Display name
 * @param {string} [params.userAgent] - Browser User-Agent
 * @param {string} [params.ipAddress] - Client IP
 * @returns {Promise<{ user: Object, sessionToken: string, expiresAt: Date }>}
 */
export async function register({ email, password, displayName, userAgent, ipAddress }) {
  if (!email || typeof email !== 'string') {
    throw new AppError('Email is required', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  passwordService.validatePasswordStrength(password);

  const cleanDisplayName = (displayName && typeof displayName === 'string')
    ? displayName.trim().substring(0, 100)
    : normalizedEmail.split('@')[0];

  // Prevent duplicate email registration
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await passwordService.hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      displayName: cleanDisplayName,
      name: cleanDisplayName,
    },
  });

  // Automatically create session for seamless signup experience
  const { rawToken, expiresAt } = await sessionService.createSession({
    userId: user.id,
    userAgent,
    ipAddress,
  });

  return {
    user: sanitizeUser(user),
    sessionToken: rawToken,
    expiresAt,
  };
}

/**
 * Authenticate an existing user with email and password.
 *
 * @param {Object} params
 * @param {string} params.email - User email
 * @param {string} params.password - Raw password
 * @param {boolean} [params.rememberMe=false] - Extend session lifetime
 * @param {string} [params.userAgent] - Browser User-Agent
 * @param {string} [params.ipAddress] - Client IP
 * @returns {Promise<{ user: Object, sessionToken: string, expiresAt: Date }>}
 */
export async function login({ email, password, rememberMe = false, userAgent, ipAddress }) {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Generic credential error to avoid account enumeration
  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await passwordService.verifyPassword(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  // Record login activity
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  }).catch(() => {});

  const { rawToken, expiresAt } = await sessionService.createSession({
    userId: user.id,
    rememberMe,
    userAgent,
    ipAddress,
  });

  return {
    user: sanitizeUser(user),
    sessionToken: rawToken,
    expiresAt,
  };
}

/**
 * Log out the current session.
 *
 * @param {string} sessionToken - Current session token
 */
export async function logout(sessionToken) {
  if (sessionToken) {
    await sessionService.revokeSessionByToken(sessionToken);
  }
}

/**
 * Log out all active sessions belonging to the user.
 *
 * @param {string} userId
 */
export async function logoutAll(userId) {
  await sessionService.revokeAllUserSessions(userId);
}

/**
 * Request a single-use password reset link.
 * Prevents account enumeration by returning a generic success message regardless of existence.
 *
 * @param {Object} params
 * @param {string} params.email
 * @returns {Promise<{ message: string, previewUrl?: string }>}
 */
export async function forgotPassword({ email }) {
  if (!email || typeof email !== 'string') {
    throw new AppError('Email is required', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const genericMessage = 'If an account exists with this email, a password reset link has been sent.';

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return { message: genericMessage };
  }

  // Invalidate any existing unused reset tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const emailResult = await emailService.sendPasswordResetEmail({
    to: user.email,
    resetToken: rawToken,
  });

  return {
    message: genericMessage,
    previewUrl: emailResult.previewUrl,
  };
}

/**
 * Reset user password with a verified single-use reset token.
 *
 * @param {Object} params
 * @param {string} params.token - Raw reset token
 * @param {string} params.newPassword - New password
 * @returns {Promise<{ message: string }>}
 */
export async function resetPassword({ token, newPassword }) {
  if (!token || typeof token !== 'string') {
    throw new AppError('Password reset token is required', 400);
  }

  passwordService.validatePasswordStrength(newPassword);

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    throw new AppError('Invalid or expired password reset token', 400);
  }

  const newHash = await passwordService.hashPassword(newPassword);

  // Update password, mark token as used, and revoke all existing sessions in transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: newHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.session.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return {
    message: 'Password has been reset successfully. Please log in with your new password.',
  };
}

/**
 * Change authenticated user's password.
 *
 * @param {string} userId - Current user ID
 * @param {string} currentSessionId - Active session ID
 * @param {Object} params
 * @param {string} params.currentPassword
 * @param {string} params.newPassword
 * @returns {Promise<{ message: string }>}
 */
export async function changePassword(userId, currentSessionId, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isCurrentMatch = await passwordService.verifyPassword(currentPassword, user.passwordHash);
  if (!isCurrentMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  if (currentPassword === newPassword) {
    throw new AppError('New password cannot be identical to the current password', 400);
  }

  passwordService.validatePasswordStrength(newPassword);
  const newHash = await passwordService.hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  // Revoke other active sessions for security, while preserving current session
  if (currentSessionId) {
    await sessionService.revokeOtherUserSessions(userId, currentSessionId);
  }

  return {
    message: 'Password changed successfully',
  };
}
