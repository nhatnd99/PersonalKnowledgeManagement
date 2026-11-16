import * as authService from './auth.service.js';
import * as sessionService from './session.service.js';
import { COOKIE_NAME, buildCookieOptions } from './auth.constants.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';

/**
 * Controller handling authentication and session management HTTP requests.
 */

/**
 * POST /api/auth/register
 */
export async function registerHandler(req, res) {
  const { email, password, displayName } = req.body;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip || req.socket?.remoteAddress;

  const { user, sessionToken, expiresAt } = await authService.register({
    email,
    password,
    displayName,
    userAgent,
    ipAddress,
  });

  res.cookie(COOKIE_NAME, sessionToken, buildCookieOptions(expiresAt));

  return sendCreated(
    res,
    { user },
    'Account registered successfully'
  );
}

/**
 * POST /api/auth/login
 */
export async function loginHandler(req, res) {
  const { email, password, rememberMe } = req.body;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip || req.socket?.remoteAddress;

  const { user, sessionToken, expiresAt } = await authService.login({
    email,
    password,
    rememberMe,
    userAgent,
    ipAddress,
  });

  res.cookie(COOKIE_NAME, sessionToken, buildCookieOptions(expiresAt));

  return sendSuccess(
    res,
    { user },
    'Login successful'
  );
}

/**
 * GET /api/auth/me
 */
export async function meHandler(req, res) {
  return sendSuccess(
    res,
    { user: req.user },
    'Current authenticated session retrieved'
  );
}

/**
 * POST /api/auth/logout
 */
export async function logoutHandler(req, res) {
  const token = req.cookies?.[COOKIE_NAME] || req.sessionToken;
  await authService.logout(token);

  res.clearCookie(COOKIE_NAME, buildCookieOptions());

  return sendSuccess(res, null, 'Logged out successfully');
}

/**
 * POST /api/auth/logout-all
 */
export async function logoutAllHandler(req, res) {
  await authService.logoutAll(req.user.id);

  res.clearCookie(COOKIE_NAME, buildCookieOptions());

  return sendSuccess(res, null, 'All sessions have been revoked');
}

/**
 * POST /api/auth/forgot-password
 */
export async function forgotPasswordHandler(req, res) {
  const result = await authService.forgotPassword({ email: req.body.email });
  return sendSuccess(res, result, result.message);
}

/**
 * POST /api/auth/reset-password
 */
export async function resetPasswordHandler(req, res) {
  const result = await authService.resetPassword({
    token: req.body.token,
    newPassword: req.body.newPassword,
  });
  return sendSuccess(res, result, result.message);
}

/**
 * PATCH /api/auth/change-password
 */
export async function changePasswordHandler(req, res) {
  const result = await authService.changePassword(
    req.user.id,
    req.session?.id,
    {
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    }
  );
  return sendSuccess(res, result, result.message);
}

/**
 * GET /api/auth/sessions
 */
export async function getSessionsHandler(req, res) {
  const sessions = await sessionService.getUserSessions(req.user.id, req.session?.id);
  return sendSuccess(res, sessions, 'Active sessions retrieved successfully');
}

/**
 * DELETE /api/auth/sessions/:sessionId
 */
export async function revokeSessionHandler(req, res) {
  const { sessionId } = req.params;
  const revoked = await sessionService.revokeSessionById(sessionId, req.user.id);

  // If user revoked their current active session, clear the cookie
  if (req.session?.id === sessionId) {
    res.clearCookie(COOKIE_NAME, buildCookieOptions());
  }

  return sendSuccess(res, { revoked }, 'Session revoked successfully');
}
