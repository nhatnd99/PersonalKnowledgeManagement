import { env } from '../config/env.js';

/**
 * Custom application error class.
 * Use this to throw structured API errors from service or controller layers.
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
 * - AppError (operational errors): return structured JSON response
 * - Mongoose validation errors: format field-level validation messages
 * - Mongoose duplicate key errors (11000): return 409 Conflict
 * - Mongoose CastError (invalid ObjectId): return 400 Bad Request
 * - Unknown errors: return 500 Internal Server Error
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

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field: ${field}`,
      errors: [{ field, message: 'Value already exists' }],
    });
  }

  // Mongoose CastError — invalid ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid value for field: ${err.path}`,
      errors: [{ field: err.path, message: 'Invalid format' }],
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
