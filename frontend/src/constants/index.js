/**
 * Application-wide constants.
 * Feature-specific constants should be defined within their feature directory.
 */

// API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Application
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Knowledge App';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.1.0';

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

// UI
export const DEFAULT_PAGE_SIZE = 20;
export const AUTO_SAVE_DELAY_MS = 1500;

// Routes
export const ROUTES = {
  HOME: '/',
  NOTES: '/notes',
  NOTE: '/notes/:noteId',
  GRAPH: '/graph',
  SEARCH: '/search',
  TAGS: '/tags',
};
