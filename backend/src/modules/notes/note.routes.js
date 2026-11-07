import { Router } from 'express';
import * as noteController from './note.controller.js';
import {
  createNoteValidation,
  updateNoteValidation,
  noteIdValidation,
  moveNoteValidation,
  listNotesValidation,
} from './note.validation.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { noteRelationshipsRouter } from '../relationships/relationship.routes.js';
import { noteTagsRouter } from '../tags/tag.routes.js';
import { exportNoteHandler, importNoteHandler } from '../export/export.controller.js';

const router = Router();

/**
 * Note routes mounted at /api/v1/notes
 */

// Import note
router.post('/import', importNoteHandler);

// Mount nested relationship routes: /api/v1/notes/:noteId/relationships
router.use('/:noteId/relationships', noteRelationshipsRouter);

// Mount nested tag routes: /api/v1/notes/:noteId/tags
router.use('/:noteId/tags', noteTagsRouter);

// Export note
router.get('/:noteId/export', noteIdValidation, validateRequest, exportNoteHandler);

router.get(
  '/',
  listNotesValidation,
  validateRequest,
  noteController.listNotes
);

router.post(
  '/',
  createNoteValidation,
  validateRequest,
  noteController.createNote
);

router.get(
  '/:noteId',
  noteIdValidation,
  validateRequest,
  noteController.getNoteById
);

router.patch(
  '/:noteId',
  updateNoteValidation,
  validateRequest,
  noteController.updateNote
);

router.patch(
  '/:noteId/move',
  moveNoteValidation,
  validateRequest,
  noteController.moveNote
);

router.delete(
  '/:noteId',
  noteIdValidation,
  validateRequest,
  noteController.deleteNote
);

export default router;
