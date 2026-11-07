import { validationResult } from 'express-validator';
import { AppError } from './errorHandler.js';

/**
 * Middleware to check express-validator validation results.
 * Use after validation rule arrays in route definitions.
 *
 * @example
 * router.post('/', createNoteValidation, validateRequest, noteController.createNote);
 */
export function validateRequest(req, _res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    throw new AppError('Validation failed', 400, formattedErrors);
  }

  next();
}
