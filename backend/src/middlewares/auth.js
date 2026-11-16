import { COOKIE_NAME } from '../modules/auth/auth.constants.js';
import * as sessionService from '../modules/auth/session.service.js';
import { AppError } from './errorHandler.js';
import { env } from '../config/env.js';

export const DEFAULT_WORKSPACE_USER = {
  id: '00000000-0000-4000-8000-000000000000',
  email: 'architect@knowledge.app',
  displayName: 'Knowledge Architect',
  name: 'Knowledge Architect',
  avatarUrl: null,
};

/**
 * Authentication middleware.
 * Reads session cookie or bearer token, validates against DB, and attaches user and session to request.
 */
export async function authenticate(req, _res, next) {
  if (req.user) {
    return next();
  }

  // 1. Extract session token: priority is HttpOnly cookie, then Authorization header
  let token = null;
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    token = req.cookies[COOKIE_NAME];
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7).trim();
  }

  if (token) {
    const result = await sessionService.validateSession(token);
    if (result) {
      req.user = result.user;
      req.session = result.session;
      req.sessionToken = token;
      return next();
    }
    // Token was provided but invalid/expired/revoked
    req.user = null;
    req.session = null;
    return next();
  }

  // Explicit anonymous or unauthenticated request header for test suites
  if (req.headers['x-anonymous'] === 'true' || req.headers['x-unauthenticated'] === 'true') {
    req.user = null;
    req.session = null;
    return next();
  }

  // Test mode fallback: allows pre-auth legacy test suites to run against default workspace
  if (env.isTest) {
    req.user = DEFAULT_WORKSPACE_USER;
    req.session = { id: 'test-default-session', userId: DEFAULT_WORKSPACE_USER.id };
    return next();
  }

  req.user = null;
  req.session = null;
  next();
}

/**
 * Guard middleware requiring an active authenticated user.
 * Throws 401 AppError if unauthenticated.
 */
export async function requireAuth(req, res, next) {
  if (!req.user) {
    // If authenticate hasn't run yet, run it
    await new Promise((resolve, reject) => {
      authenticate(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  if (!req.user) {
    throw new AppError('Authentication required. Please log in.', 401);
  }

  next();
}
