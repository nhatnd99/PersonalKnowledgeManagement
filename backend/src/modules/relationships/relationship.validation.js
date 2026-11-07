import { body, param, query } from 'express-validator';
import { RELATIONSHIP_TYPES } from '../../constants/index.js';

const validRelationshipTypes = Object.values(RELATIONSHIP_TYPES);

/**
 * Validation rules for creating a relationship between notes.
 */
export const createRelationshipValidation = [
  body('sourceNoteId')
    .notEmpty()
    .withMessage('Source note ID is required')
    .isUUID(4)
    .withMessage('Source note ID must be a valid UUIDv4'),

  body('targetNoteId')
    .notEmpty()
    .withMessage('Target note ID is required')
    .isUUID(4)
    .withMessage('Target note ID must be a valid UUIDv4')
    .custom((value, { req }) => {
      if (value === req.body.sourceNoteId) {
        throw new Error('A note cannot have a relationship with itself');
      }
      return true;
    }),

  body('relationshipType')
    .notEmpty()
    .withMessage('Relationship type is required')
    .isIn(validRelationshipTypes)
    .withMessage(`Relationship type must be one of: ${validRelationshipTypes.join(', ')}`),

  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
];

/**
 * Validation rules for querying note relationships.
 */
export const getNoteRelationshipsValidation = [
  param('noteId')
    .isUUID(4)
    .withMessage('Note ID must be a valid UUIDv4'),

  query('direction')
    .optional()
    .isIn(['incoming', 'outgoing', 'both'])
    .withMessage('Direction must be one of: incoming, outgoing, both'),

  query('type')
    .optional()
    .isIn(validRelationshipTypes)
    .withMessage(`Type must be one of: ${validRelationshipTypes.join(', ')}`),
];

/**
 * Validation rules for relationship ID parameter.
 */
export const relationshipIdValidation = [
  param('id')
    .isUUID(4)
    .withMessage('Relationship ID must be a valid UUIDv4'),
];
