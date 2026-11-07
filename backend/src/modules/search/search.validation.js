import { query } from 'express-validator';
import { NOTE_TYPES } from '../../constants/index.js';

/**
 * Validation rules for searching notes.
 */
export const searchNotesValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search query must not exceed 200 characters'),

  query('tag')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Tag filter must not exceed 100 characters'),

  query('type')
    .optional()
    .isIn(Object.values(NOTE_TYPES))
    .withMessage('Type filter must be either NOTE or FOLDER'),

  query('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('isFavorite must be a boolean')
    .toBoolean(),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
];
