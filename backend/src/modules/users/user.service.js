import { prisma } from '../../config/database.js';

/**
 * Service handling user account and workspace profile operations.
 * Prepared for future multi-user authentication while providing local workspace identity in MVP.
 */

const DEFAULT_WORKSPACE_USER_ID = '00000000-0000-4000-8000-000000000000';

/**
 * Get the current workspace user profile.
 * Creates a default workspace user record if none exists.
 *
 * @returns {Promise<Object>} User profile
 */
export async function getCurrentUserProfile() {
  let user = await prisma.user.findFirst();

  if (!user) {
    try {
      user = await prisma.user.create({
        data: {
          id: DEFAULT_WORKSPACE_USER_ID,
          name: 'Knowledge Architect',
          email: 'architect@knowledge.app',
        },
      });
    } catch {
      // Return local fallback object if DB is read-only
      user = {
        id: DEFAULT_WORKSPACE_USER_ID,
        name: 'Knowledge Architect',
        email: 'architect@knowledge.app',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  return user;
}

/**
 * Update the workspace user profile.
 *
 * @param {Object} data - Update data
 * @param {string} [data.name] - Display name
 * @param {string} [data.email] - Email
 * @returns {Promise<Object>} Updated profile
 */
export async function updateCurrentUserProfile(data) {
  const current = await getCurrentUserProfile();

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.email !== undefined) updateData.email = data.email.trim();

  const updated = await prisma.user.update({
    where: { id: current.id },
    data: updateData,
  });

  return updated;
}
