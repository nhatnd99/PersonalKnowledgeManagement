import bcrypt from 'bcryptjs';
import { AppError } from '../../middlewares/errorHandler.js';

const SALT_ROUNDS = 10;
const MIN_LENGTH = 12;
const MAX_LENGTH = 128;

/**
 * Validate password strength against security policy.
 * Requirements:
 * - 12 to 128 characters.
 * - At least one uppercase letter.
 * - At least one lowercase letter.
 * - At least one number or symbol.
 * - Do NOT trim passwords.
 *
 * @param {string} password - Raw password
 * @throws {AppError} If password does not meet requirements
 */
export function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    throw new AppError('Password is required', 400);
  }

  if (password.length < MIN_LENGTH) {
    throw new AppError(`Password must be at least ${MIN_LENGTH} characters long`, 400);
  }

  if (password.length > MAX_LENGTH) {
    throw new AppError(`Password cannot exceed ${MAX_LENGTH} characters`, 400);
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumberOrSymbol = /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);

  if (!hasUpper || !hasLower || !hasNumberOrSymbol) {
    throw new AppError(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number or special character',
      400
    );
  }
}

/**
 * Hash a plain text password using bcrypt.
 *
 * @param {string} password - Raw password
 * @returns {Promise<string>} BCRYPT password hash
 */
export async function hashPassword(password) {
  validatePasswordStrength(password);
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare plain text password against hash.
 *
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash
 * @returns {Promise<boolean>} True if match
 */
export async function verifyPassword(password, hash) {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}
