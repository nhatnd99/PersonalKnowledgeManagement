import { env } from '../config/env.js';

/**
 * Custom application error class.
 * Use this to throw structured operational API errors from service layers.
 *
 * @example
 * throw new AppError('Note not found', 404);
 * throw new AppError('Validation failed', 400, [{ field: 'title', message: 'Required' }]);
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found handler.
 * Mounted after all route definitions to catch unmatched routes.
 */
export function notFoundHandler(req, res, _next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    errors: [],
  });
}

/**
 * Global error handler middleware.
 * Must be the last middleware registered in app.js.
 *
 * Handles:
 * - AppError: operational business logic errors
 * - Prisma P2002: Unique constraint violation (409 Conflict)
 * - Prisma P2025: Record not found (404 Not Found)
 * - Prisma P2003: Foreign key constraint failure (400 Bad Request)
 * - PrismaClientValidationError: invalid query payload (400 Bad Request)
 * - Unknown runtime errors (500 Internal Server Error)
 */
export function globalErrorHandler(err, _req, res, _next) {
  // AppError — operational, known error
  if (err.name === 'AppError' || err.isOperational) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  }

  // Prisma Client Known Request Errors
  if (err.code === 'P2002') {
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${target} already exists`,
      errors: [{ field: target, message: 'Unique constraint violation' }],
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: err.meta?.cause || 'Record not found',
      errors: [],
    });
  }

  if (err.code === 'P2003') {
    const field = err.meta?.field_name || 'relation';
    return res.status(400).json({
      success: false,
      message: `Invalid reference on foreign key: ${field}`,
      errors: [{ field, message: 'Foreign key constraint failed' }],
    });
  }

  // Prisma Client Validation Error
  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid data provided to database operation',
      errors: [],
    });
  }

  // Unknown / unexpected error — do not expose internals in production
  console.error('[Error] Unexpected error:', err);

  return res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    errors: [],
    ...(env.isDevelopment && { stack: err.stack }),
  });
}
