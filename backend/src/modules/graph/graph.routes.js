import { Router } from 'express';
import * as graphController from './graph.controller.js';
import { getGraphValidation, getFolderGraphValidation } from './graph.validation.js';
import { validateRequest } from '../../middlewares/validateRequest.js';

const router = Router();

/**
 * Knowledge Graph routes mounted at /api/v1/graph
 */

// Root Workspace Graph
router.get(
  '/root',
  getGraphValidation,
  validateRequest,
  graphController.getRootGraphHandler
);

// Folder-Scoped Graph
router.get(
  '/folders/:folderId',
  getFolderGraphValidation,
  validateRequest,
  graphController.getFolderGraphHandler
);

// Legacy and general graph query endpoint (supports ?folderId=...)
router.get(
  '/',
  getGraphValidation,
  validateRequest,
  graphController.getGraphHandler
);

export default router;

