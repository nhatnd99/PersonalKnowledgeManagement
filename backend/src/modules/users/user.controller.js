import * as userService from './user.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

/**
 * Controller handling user profile requests.
 */

/**
 * GET /api/v1/user/profile
 */
export async function getProfileHandler(_req, res) {
  const user = await userService.getCurrentUserProfile();
  return sendSuccess(res, user, 'User profile retrieved successfully');
}

/**
 * PATCH /api/v1/user/profile
 */
export async function updateProfileHandler(req, res) {
  const updated = await userService.updateCurrentUserProfile(req.body);
  return sendSuccess(res, updated, 'User profile updated successfully');
}
