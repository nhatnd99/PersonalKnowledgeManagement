import { Router } from 'express';
import * as relationshipController from './relationship.controller.js';
import {
  createRelationshipValidation,
  relationshipIdValidation,
  updateRelationshipValidation,
  getEntityRelationshipsValidation,
  getNoteRelationshipsValidation,
} from './relationship.validation.js';
import { validateRequest } from '../../middlewares/validateRequest.js';

const router = Router();

/**
 * Routes mounted at /api/v1/relationships
 */

router.get(
  '/',
  relationshipController.listRelationshipsHandler
);

router.post(
  '/',
  createRelationshipValidation,
  validateRequest,
  relationshipController.createRelationshipHandler
);

router.get(
  '/:id',
  relationshipIdValidation,
  validateRequest,
  relationshipController.getRelationshipByIdHandler
);

router.patch(
  '/:id',
  updateRelationshipValidation,
  validateRequest,
  relationshipController.updateRelationshipHandler
);

router.delete(
  '/:id',
  relationshipIdValidation,
  validateRequest,
  relationshipController.deleteRelationshipHandler
);

// Entity-scoped relationship lookup: /api/v1/relationships/:entityType/:entityId
router.get(
  '/:entityType/:entityId',
  getEntityRelationshipsValidation,
  validateRequest,
  relationshipController.getEntityRelationshipsHandler
);

export default router;

/**
 * Router for note-scoped relationships: /api/v1/notes/:noteId/relationships
 */
export const noteRelationshipsRouter = Router({ mergeParams: true });

noteRelationshipsRouter.get(
  '/',
  getNoteRelationshipsValidation,
  validateRequest,
  relationshipController.getNoteRelationshipsHandler
);
