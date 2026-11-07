import { body, param } from 'express-validator';

/**
 * Validation rules for creating a tag.
 */
export const createTagValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tag name is required')
    .isLength({ max: 100 })
    .withMessage('Tag name must not exceed 100 characters'),

  body('color')
    .optional({ nullable: true })
    .trim()
    .matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .withMessage('Color must be a valid hex code (e.g. #3b82f6)'),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
];

/**
 * Validation rules for updating a tag.
 */
export const updateTagValidation = [
  param('tagId')
    .isUUID(4)
    .withMessage('Tag ID must be a valid UUIDv4'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Tag name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Tag name must not exceed 100 characters'),

  body('color')
    .optional({ nullable: true })
    .trim()
    .matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .withMessage('Color must be a valid hex code (e.g. #3b82f6)'),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
];

/**
 * Validation rules for tag ID param.
 */
export const tagIdValidation = [
  param('tagId')
    .isUUID(4)
    .withMessage('Tag ID must be a valid UUIDv4'),
];

/**
 * Validation rules for assigning a tag to a note.
 */
export const assignTagToNoteValidation = [
  param('noteId')
    .isUUID(4)
    .withMessage('Note ID must be a valid UUIDv4'),

  body('tagId')
    .notEmpty()
    .withMessage('Tag ID is required')
    .isUUID(4)
    .withMessage('Tag ID must be a valid UUIDv4'),
];

/**
 * Validation rules for removing a tag from a note.
 */
export const removeTagFromNoteValidation = [
  param('noteId')
    .isUUID(4)
    .withMessage('Note ID must be a valid UUIDv4'),

  param('tagId')
    .isUUID(4)
    .withMessage('Tag ID must be a valid UUIDv4'),
];
