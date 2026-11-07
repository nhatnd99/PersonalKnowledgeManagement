/**
 * Backend application-wide constants.
 */

// Note types
export const NOTE_TYPES = {
  NOTE: 'NOTE',
  FOLDER: 'FOLDER',
};

// Relationship types
export const RELATIONSHIP_TYPES = {
  RELATED_TO: 'RELATED_TO',
  DEPENDS_ON: 'DEPENDS_ON',
  REFERENCES: 'REFERENCES',
  EXTENDS: 'EXTENDS',
  CONTRADICTS: 'CONTRADICTS',
};

// Content formats
export const CONTENT_FORMATS = {
  HTML: 'html',
  MARKDOWN: 'markdown',
  PLAIN: 'plain',
};

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// Sort options
export const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc',
};
