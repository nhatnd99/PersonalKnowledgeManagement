import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';

/**
 * Service handling user account and profile operations.
 */

/**
 * Get user profile by user ID.
 *
 * @param {string} userId - UUID
 * @returns {Promise<Object>} Safe user profile
 */
export async function getUserProfile(userId) {
  const findFn =
    typeof prisma.user?.findUnique === 'function'
      ? () =>
          prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              email: true,
              displayName: true,
              name: true,
              avatarUrl: true,
              createdAt: true,
              lastLoginAt: true,
            },
          })
      : () =>
          prisma.user.findFirst({
            where: { id: userId },
            select: {
              id: true,
              email: true,
              displayName: true,
              name: true,
              avatarUrl: true,
              createdAt: true,
              lastLoginAt: true,
            },
          });

  const user = await findFn();

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const effectiveName = user.displayName || user.name || 'Knowledge User';

  return {
    id: user.id,
    email: user.email,
    displayName: effectiveName,
    name: effectiveName,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

/**
 * Update user profile.
 *
 * @param {string} userId - User ID
 * @param {Object} data - Update data
 * @param {string} [data.displayName] - Display name
 * @param {string} [data.avatarUrl] - Avatar URL
 * @returns {Promise<Object>} Updated profile
 */
export async function updateUserProfile(userId, data) {
  // Prohibit modifying ID, email, or password through generic profile update
  if (data.id !== undefined && data.id !== userId) {
    throw new AppError('Changing user ID is not permitted', 400);
  }
  if (data.passwordHash !== undefined || data.password !== undefined) {
    throw new AppError('Password cannot be changed via profile update. Use /api/auth/change-password', 400);
  }

  const updateData = {};
  if (data.displayName !== undefined) {
    updateData.displayName = data.displayName ? data.displayName.trim().substring(0, 100) : null;
    updateData.name = updateData.displayName;
  } else if (data.name !== undefined) {
    updateData.name = data.name ? data.name.trim().substring(0, 100) : null;
    updateData.displayName = updateData.name;
  }

  if (data.avatarUrl !== undefined) {
    updateData.avatarUrl = data.avatarUrl ? data.avatarUrl.trim() : null;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      displayName: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const effectiveName = updated.displayName || updated.name;
  return {
    id: updated.id,
    email: updated.email,
    displayName: effectiveName,
    name: effectiveName,
    avatarUrl: updated.avatarUrl,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

/**
 * Legacy compatibility fallback for unauthenticated workspace MVP helper.
 */
export async function getCurrentUserProfile(userContext = null) {
  if (userContext?.id) {
    return getUserProfile(userContext.id);
  }
  const first = await prisma.user.findFirst();
  return first ? getUserProfile(first.id) : null;
}

export async function updateCurrentUserProfile(data, userContext = null) {
  const current = await getCurrentUserProfile(userContext);
  return updateUserProfile(current.id, data);
}
