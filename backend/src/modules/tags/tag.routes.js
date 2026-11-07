import { Router } from 'express';
import * as tagController from './tag.controller.js';
import {
  createTagValidation,
  updateTagValidation,
  tagIdValidation,
  assignTagToNoteValidation,
  removeTagFromNoteValidation,
} from './tag.validation.js';
import { validateRequest } from '../../middlewares/validateRequest.js';

const router = Router();

/**
 * Tag routes mounted at /api/v1/tags
 */

router.get(
  '/',
  tagController.listTagsHandler
);

router.post(
  '/',
  createTagValidation,
  validateRequest,
  tagController.createTagHandler
);

router.get(
  '/:tagId',
  tagIdValidation,
  validateRequest,
  tagController.getTagByIdHandler
);

router.patch(
  '/:tagId',
  updateTagValidation,
  validateRequest,
  tagController.updateTagHandler
);

router.delete(
  '/:tagId',
  tagIdValidation,
  validateRequest,
  tagController.deleteTagHandler
);

export default router;

/**
 * Note-scoped tags router mounted at /api/v1/notes/:noteId/tags
 */
export const noteTagsRouter = Router({ mergeParams: true });

noteTagsRouter.post(
  '/',
  assignTagToNoteValidation,
  validateRequest,
  tagController.assignTagToNoteHandler
);

noteTagsRouter.delete(
  '/:tagId',
  removeTagFromNoteValidation,
  validateRequest,
  tagController.removeTagFromNoteHandler
);
