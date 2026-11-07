import { query } from 'express-validator';
import { RELATIONSHIP_TYPES } from '../../constants/index.js';

/**
 * Validation rules for retrieving knowledge graph nodes and edges.
 */
export const getGraphValidation = [
  query('rootId')
    .optional()
    .isUUID(4)
    .withMessage('rootId must be a valid UUIDv4'),

  query('depth')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Depth must be between 1 and 5')
    .toInt(),

  query('relationshipType')
    .optional()
    .isIn(Object.values(RELATIONSHIP_TYPES))
    .withMessage('Invalid relationshipType filter'),

  query('includeHierarchy')
    .optional()
    .isBoolean()
    .withMessage('includeHierarchy must be a boolean')
    .toBoolean(),
];
