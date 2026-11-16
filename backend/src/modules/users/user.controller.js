import * as userService from './user.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

/**
 * Controller handling user profile requests.
 */

/**
 * GET /api/users/me & GET /api/v1/user/profile
 */
export async function getProfileHandler(req, res) {
  const userId = req.user?.id || (await userService.getCurrentUserProfile())?.id;
  const user = await userService.getUserProfile(userId);
  return sendSuccess(res, user, 'User profile retrieved successfully');
}

/**
 * PATCH /api/users/me & PATCH /api/v1/user/profile
 */
export async function updateProfileHandler(req, res) {
  const userId = req.user?.id || (await userService.getCurrentUserProfile())?.id;
  const updated = await userService.updateUserProfile(userId, req.body);
  return sendSuccess(res, updated, 'User profile updated successfully');
}
