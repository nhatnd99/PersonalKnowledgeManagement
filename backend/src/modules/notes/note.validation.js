import { body, param, query } from 'express-validator';
import { NOTE_TYPES, CONTENT_FORMATS } from '../../constants/index.js';

/**
 * Validation rules for creating a note.
 */
export const createNoteValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),

  body('type')
    .optional()
    .isIn(Object.values(NOTE_TYPES))
    .withMessage(`Type must be one of: ${Object.values(NOTE_TYPES).join(', ')}`),

  body('content')
    .optional({ nullable: true }),

  body('contentFormat')
    .optional()
    .isIn(Object.values(CONTENT_FORMATS))
    .withMessage(`Content format must be one of: ${Object.values(CONTENT_FORMATS).join(', ')}`),

  body('parentId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Parent ID must be a valid UUID or null'),

  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),

  body('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('isFavorite must be a boolean'),
];

/**
 * Validation rules for updating a note.
 */
export const updateNoteValidation = [
  param('noteId')
    .isUUID()
    .withMessage('Note ID must be a valid UUID'),

  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),

  body('type')
    .optional()
    .isIn(Object.values(NOTE_TYPES))
    .withMessage(`Type must be one of: ${Object.values(NOTE_TYPES).join(', ')}`),

  body('content')
    .optional({ nullable: true }),

  body('contentFormat')
    .optional()
    .isIn(Object.values(CONTENT_FORMATS))
    .withMessage(`Content format must be one of: ${Object.values(CONTENT_FORMATS).join(', ')}`),

  body('parentId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Parent ID must be a valid UUID or null'),

  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),

  body('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('isFavorite must be a boolean'),

  body('archivedAt')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('archivedAt must be a valid ISO 8601 date string or null'),
];

/**
 * Validation rules for note UUID parameter.
 */
export const noteIdValidation = [
  param('noteId')
    .isUUID()
    .withMessage('Note ID must be a valid UUID'),
];

/**
 * Validation rules for moving a note.
 */
export const moveNoteValidation = [
  param('noteId')
    .isUUID()
    .withMessage('Note ID must be a valid UUID'),

  body('newParentId')
    .custom((value) => {
      if (value === null || value === undefined) return true;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error('newParentId must be a valid UUID or null');
      }
      return true;
    }),
];

/**
 * Validation rules for listing notes.
 */
export const listNotesValidation = [
  query('parentId')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === 'null' || value === null) return true;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error('parentId must be a valid UUID or "null"');
      }
      return true;
    }),

  query('type')
    .optional()
    .isIn(Object.values(NOTE_TYPES))
    .withMessage(`Type must be one of: ${Object.values(NOTE_TYPES).join(', ')}`),

  query('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('isFavorite must be a boolean'),

  query('isArchived')
    .optional()
    .isBoolean()
    .withMessage('isArchived must be a boolean'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];
