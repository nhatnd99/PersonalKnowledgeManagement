import { param, query } from 'express-validator';
import { RELATIONSHIP_TYPES } from '../../constants/index.js';

/**
 * Validation rules for retrieving knowledge graph nodes and edges.
 */
export const getGraphValidation = [
  query('rootId')
    .optional()
    .isUUID(4)
    .withMessage('rootId must be a valid UUIDv4'),

  query('folderId')
    .optional()
    .custom((val) => val === 'root' || /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val))
    .withMessage('folderId must be "root" or a valid UUIDv4'),

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

export const getFolderGraphValidation = [
  param('folderId')
    .notEmpty()
    .withMessage('folderId is required')
    .custom((val) => val === 'root' || /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val))
    .withMessage('folderId must be "root" or a valid UUIDv4'),

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

